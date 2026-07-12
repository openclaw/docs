---
x-i18n:
    generated_at: "2026-07-12T14:50:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Przewodnik po dokumentacji

Ten katalog obejmuje tworzenie dokumentacji, reguły linków Mintlify oraz zasady internacjonalizacji dokumentacji.

## Reguły Mintlify

- Dokumentacja jest hostowana w Mintlify (`https://docs.openclaw.ai`).
- Wewnętrzne linki do dokumentacji w `docs/**/*.md` muszą pozostać względne względem katalogu głównego, bez rozszerzenia `.md` ani `.mdx` (przykład: `[Konfiguracja](/gateway/configuration)`).
- Odwołania do sekcji powinny używać kotwic w ścieżkach względnych względem katalogu głównego (przykład: `[Hooki](/gateway/configuration-reference#hooks)`).
- W nagłówkach dokumentacji należy unikać pauz i apostrofów, ponieważ generowanie kotwic przez Mintlify jest w ich przypadku zawodne.
- README i inne dokumenty renderowane przez GitHub powinny zachowywać bezwzględne adresy URL dokumentacji, aby linki działały poza Mintlify.
- Treść dokumentacji musi pozostać ogólna: bez osobistych nazw urządzeń, nazw hostów ani lokalnych ścieżek; należy używać symboli zastępczych, takich jak `user@gateway-host`.

## Reguły dotyczące treści dokumentacji

- W dokumentacji, tekstach interfejsu użytkownika i listach wyboru należy porządkować usługi/dostawców alfabetycznie, chyba że sekcja wyraźnie opisuje kolejność działania lub kolejność automatycznego wykrywania.
- Nazewnictwo dołączonych pluginów należy utrzymywać zgodnie z ogólnorepozytoryjnymi regułami terminologii pluginów w głównym pliku `AGENTS.md`.
- Dokumentacja generowana — nigdy nie edytuj jej ręcznie: `docs/plugins/reference/**`, `docs/plugins/reference.md` i `docs/plugins/plugin-inventory.md` pochodzą z `pnpm plugins:inventory:gen`; `docs/docs_map.md` z `pnpm docs:map:gen`; `docs/maturity/**` z `pnpm maturity:render`.

## Dokumentacja wewnętrzna

- Długoterminowa prywatna dokumentacja operatora powinna znajdować się w `~/Projects/manager/docs/`.
- Wewnętrzne dokumenty robocze lub kopie lokalne repozytorium mogą znajdować się w ignorowanym katalogu `docs/internal/`.
- Nigdy nie dodawaj stron `docs/internal/**` do nawigacji `docs/docs.json` ani nie umieszczaj do nich linków w publicznej dokumentacji.
- `scripts/docs-sync-publish.mjs` wyklucza i usuwa `docs/internal/**` z publicznego repozytorium publikacyjnego `openclaw/docs`, jeśli strona zostanie później dodana wymuszenie.
- Dokumentacja wewnętrzna może zawierać ścieżki repozytorium, nazwy prywatnych aplikacji, nazwy elementów 1Password i procedury operacyjne, ale nigdy wartości tajnych danych.

## Edytowanie karty wyników dojrzałości

`taxonomy.yaml` i `qa/maturity-scores.yaml` są danymi źródłowymi; wygenerowane dokumenty dojrzałości w `docs/maturity/` są ich odwzorowaniem i nie powinny być edytowane ręcznie w zakresie wyników, LTS, taksonomii, profilu QA ani tabel dowodów.
Za generowanie odpowiada `scripts/qa/render-maturity-docs.ts`; użyj `pnpm maturity:render`, aby odświeżyć zatwierdzone dokumenty, oraz `pnpm maturity:check`, aby je zweryfikować.
`.github/workflows/maturity-scorecard.yml` generuje podglądy artefaktów i może otwierać PR-y z wygenerowaną dokumentacją; `.github/workflows/openclaw-release-checks.yml` uruchamia go na potrzeby kontroli jakości wydania.
Deterministyczne dane `qa-evidence.json.scorecard` przechowuj w artefaktach GitHub Actions, chyba że opiekun wyraźnie poprosi o oczyszczone odwzorowanie zatwierdzone w repozytorium.
Ręczne nadpisania muszą zmieniać stan źródłowy w PR-ze oraz wyjaśniać przyczynę wraz z publicznymi lub zredagowanymi dowodami.

## Internacjonalizacja dokumentacji

- Dokumentacja w językach obcych nie jest utrzymywana w tym repozytorium. Wygenerowane dane publikacyjne znajdują się w oddzielnym repozytorium `openclaw/docs` (często klonowanym lokalnie jako `../openclaw-docs`).
- Nie dodawaj ani nie edytuj tutaj zlokalizowanej dokumentacji w `docs/<locale>/**`.
- Traktuj angielską dokumentację w tym repozytorium oraz pliki glosariuszy jako źródło prawdy.
- Potok: zaktualizuj tutaj angielską dokumentację, w razie potrzeby zaktualizuj `docs/.i18n/glossary.<locale>.json`, a następnie pozwól na uruchomienie synchronizacji repozytorium publikacyjnego i `scripts/docs-i18n` w `openclaw/docs`.
- Przed ponownym uruchomieniem `scripts/docs-i18n` dodaj wpisy do glosariusza dla wszystkich nowych terminów technicznych, tytułów stron lub krótkich etykiet nawigacyjnych, które muszą pozostać po angielsku albo mieć stałe tłumaczenie.
- `pnpm docs:check-i18n-glossary` zabezpiecza zmienione angielskie tytuły dokumentów i krótkie etykiety dokumentacji wewnętrznej.
- Pamięć tłumaczeniowa znajduje się w wygenerowanych plikach `docs/.i18n/*.tm.jsonl` w repozytorium publikacyjnym.
- Zobacz `docs/.i18n/README.md`.
