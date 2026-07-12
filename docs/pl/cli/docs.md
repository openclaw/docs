---
read_when:
    - Chcesz przeszukiwać aktualną dokumentację OpenClaw z poziomu terminala
    - Musisz wiedzieć, z którego hostowanego API wyszukiwania korzysta CLI dokumentacji
summary: Dokumentacja referencyjna CLI dla `openclaw docs` (przeszukiwanie indeksu dokumentacji na żywo)
title: Dokumentacja
x-i18n:
    generated_at: "2026-07-12T14:54:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Przeszukuj aktualny indeks dokumentacji OpenClaw z poziomu terminala.

## Użycie

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| Argument     | Opis                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `[query...]` | Zapytanie wyszukiwania w dowolnej formie. Zapytania wielowyrazowe są łączone spacjami i wysyłane jako jedno. |

Bez zapytania polecenie `openclaw docs` wyświetla adres URL strony głównej dokumentacji i przykładowe polecenie wyszukiwania zamiast uruchamiać wyszukiwanie.

## Przykłady

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Jak to działa

Polecenie `openclaw docs` wywołuje `https://docs.openclaw.ai/api/search` i wyświetla wyniki JSON. Żądanie wyszukiwania ma stały limit czasu wynoszący 30 sekund.

## Dane wyjściowe

W terminalu z rozszerzonym formatowaniem (TTY) wyniki są wyświetlane jako nagłówek, po którym następuje lista punktowana: tytuł strony, połączony z odnośnikiem adres URL dokumentacji oraz krótki fragment w następnym wierszu. W przypadku braku wyników wyświetlany jest komunikat „Brak wyników.”.

W danych wyjściowych bez rozszerzonego formatowania (przekierowanych potokiem, z opcją `--no-color`, w skryptach) te same dane są wyświetlane jako Markdown:

```markdown
# Wyszukiwanie w dokumentacji: <query>

- [Tytuł](https://docs.openclaw.ai/...) - fragment
- [Tytuł](https://docs.openclaw.ai/...) - fragment
```

## Kody zakończenia

| Kod | Znaczenie                                                                             |
| --- | ------------------------------------------------------------------------------------- |
| `0` | Wyszukiwanie zakończyło się powodzeniem, również gdy odpowiedź nie zawiera wyników.   |
| `1` | Wywołanie hostowanego API wyszukiwania dokumentacji nie powiodło się; komunikat o błędzie jest wyświetlany w stderr. |

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Aktualna dokumentacja](https://docs.openclaw.ai)
