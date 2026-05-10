---
read_when:
    - Chcesz przeszukiwać aktualną dokumentację OpenClaw z terminala
    - Musisz wiedzieć, które pomocnicze pliki binarne CLI dokumentacji uruchamia przez powłokę
summary: Referencja CLI dla `openclaw docs` (przeszukaj indeks dokumentacji na żywo)
title: Dokumentacja
x-i18n:
    generated_at: "2026-05-10T19:28:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Przeszukuj aktywny indeks dokumentacji OpenClaw z terminala. Polecenie wywołuje publiczny punkt końcowy wyszukiwania MCP dokumentacji hostowanej przez Mintlify pod adresem `https://docs.openclaw.ai/mcp.SearchOpenClaw` i wyświetla wyniki w terminalu.

## Użycie

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumenty:

| Argument     | Opis                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | Dowolne zapytanie wyszukiwania. Zapytania wielowyrazowe są łączone spacjami i wysyłane jako jedno. |

## Przykłady

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Bez zapytania `openclaw docs` wypisuje adres URL punktu wejścia dokumentacji oraz przykładowe polecenie wyszukiwania zamiast uruchamiać wyszukiwanie.

## Jak to działa

`openclaw docs` wywołuje CLI `mcporter`, aby uruchomić narzędzie MCP wyszukiwania dokumentacji, a następnie parsuje bloki `Title: / Link: / Content:` z wyjścia narzędzia do listy wyników.

Aby rozwiązać `mcporter`, OpenClaw sprawdza kolejno:

1. `mcporter` w `PATH` (używany bezpośrednio, jeśli jest dostępny).
2. `pnpm dlx mcporter ...`, jeśli `pnpm` jest zainstalowany.
3. `npx -y mcporter ...`, jeśli `npx` jest zainstalowany.

Jeśli żadne z nich nie jest dostępne, polecenie kończy się niepowodzeniem z podpowiedzią, aby zainstalować `pnpm` (`npm install -g pnpm`).

Wywołanie wyszukiwania używa stałego limitu czasu 30 sekund. Fragmenty wyników są skracane do około 220 znaków na wpis.

## Wyjście

W terminalu z bogatym wyjściem (TTY) wyniki są renderowane jako nagłówek, po którym następuje lista punktowana. Każdy punkt pokazuje tytuł strony, połączony adres URL dokumentacji oraz krótki fragment w następnym wierszu. Puste wyniki wypisują „Brak wyników.”.

W zwykłym wyjściu (przekierowanym, `--no-color`, skrypty) te same dane są renderowane jako Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Kody zakończenia

| Kod | Znaczenie                                           |
| --- | --------------------------------------------------- |
| `0` | Wyszukiwanie powiodło się (w tym odpowiedzi z zerową liczbą wyników). |
| `1` | Wywołanie narzędzia MCP nie powiodło się; stderr jest wypisywany w treści. |

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Aktywna dokumentacja](https://docs.openclaw.ai)
