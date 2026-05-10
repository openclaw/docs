---
x-i18n:
    generated_at: "2026-05-10T19:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Przewodnik po dokumentacji

Ten katalog odpowiada za tworzenie dokumentacji, reguły linków Mintlify oraz zasady i18n dokumentacji.

## Reguły Mintlify

- Dokumentacja jest hostowana w Mintlify (`https://docs.openclaw.ai`).
- Wewnętrzne linki do dokumentacji w `docs/**/*.md` muszą pozostać względne względem katalogu głównego, bez sufiksu `.md` ani `.mdx` (przykład: `[Config](/gateway/configuration)`).
- Odwołania krzyżowe do sekcji powinny używać kotwic na ścieżkach względnych względem katalogu głównego (przykład: `[Hooks](/gateway/configuration-reference#hooks)`).
- Nagłówki dokumentacji powinny unikać pauz i apostrofów, ponieważ generowanie kotwic w Mintlify jest w tych przypadkach kruche.
- README i inne dokumenty renderowane przez GitHub powinny zachowywać bezwzględne URL-e dokumentacji, aby linki działały poza Mintlify.
- Treść dokumentacji musi pozostać ogólna: bez nazw osobistych urządzeń, nazw hostów ani ścieżek lokalnych; używaj symboli zastępczych, takich jak `user@gateway-host`.

## Reguły treści dokumentacji

- W dokumentacji, tekstach UI i listach wyboru porządkuj usługi/dostawców alfabetycznie, chyba że sekcja wyraźnie opisuje kolejność działania albo kolejność automatycznego wykrywania.
- Utrzymuj nazewnictwo dołączonych Plugin spójne z ogólnorepozytoryjnymi regułami terminologii Plugin w głównym `AGENTS.md`.

## Dokumentacja wewnętrzna

- Długotrwała prywatna dokumentacja operatorska należy do `~/Projects/manager/docs/`.
- Lokalne dla repozytorium wewnętrzne dokumenty robocze/lustrzane mogą znajdować się w ignorowanym `docs/internal/`.
- Nigdy nie dodawaj stron `docs/internal/**` do nawigacji `docs/docs.json` ani nie linkuj do nich z publicznej dokumentacji.
- `scripts/docs-sync-publish.mjs` wyklucza i usuwa `docs/internal/**` z publicznego repozytorium publikacji `openclaw/docs`, jeśli strona zostanie później dodana wymuszeniem.
- Dokumentacja wewnętrzna może wspominać ścieżki repozytorium, nazwy prywatnych aplikacji, nazwy elementów 1Password i runbooki, ale nigdy nie może zawierać wartości sekretów.

## i18n dokumentacji

- Dokumentacja w językach obcych nie jest utrzymywana w tym repozytorium. Wygenerowane wyjście publikacji znajduje się w osobnym repozytorium `openclaw/docs` (często klonowanym lokalnie jako `../openclaw-docs`).
- Nie dodawaj ani nie edytuj tutaj zlokalizowanej dokumentacji pod `docs/<locale>/**`.
- Traktuj angielską dokumentację w tym repozytorium oraz pliki glosariusza jako źródło prawdy.
- Pipeline: zaktualizuj tutaj angielską dokumentację, w razie potrzeby zaktualizuj `docs/.i18n/glossary.<locale>.json`, a następnie pozwól, aby synchronizacja repozytorium publikacji i `scripts/docs-i18n` uruchomiły się w `openclaw/docs`.
- Przed ponownym uruchomieniem `scripts/docs-i18n` dodaj wpisy glosariusza dla wszystkich nowych terminów technicznych, tytułów stron lub krótkich etykiet nawigacji, które muszą pozostać po angielsku albo używać ustalonego tłumaczenia.
- `pnpm docs:check-i18n-glossary` jest zabezpieczeniem dla zmienionych angielskich tytułów dokumentacji i krótkich wewnętrznych etykiet dokumentacji.
- Pamięć tłumaczeniowa znajduje się w wygenerowanych plikach `docs/.i18n/*.tm.jsonl` w repozytorium publikacji.
- Zobacz `docs/.i18n/README.md`.
