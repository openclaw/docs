---
x-i18n:
    generated_at: "2026-06-27T17:08:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Przewodnik po dokumentacji

Ten katalog odpowiada za tworzenie dokumentacji, reguły linków Mintlify oraz politykę i18n dokumentacji.

## Reguły Mintlify

- Dokumentacja jest hostowana w Mintlify (`https://docs.openclaw.ai`).
- Wewnętrzne linki dokumentacji w `docs/**/*.md` muszą pozostać względne względem katalogu głównego, bez sufiksu `.md` ani `.mdx` (przykład: `[Konfiguracja](/gateway/configuration)`).
- Odwołania między sekcjami powinny używać kotwic na ścieżkach względnych względem katalogu głównego (przykład: `[Haki](/gateway/configuration-reference#hooks)`).
- Nagłówki dokumentacji powinny unikać półpauz i apostrofów, ponieważ generowanie kotwic w Mintlify jest w tych przypadkach kruche.
- README i inna dokumentacja renderowana przez GitHub powinny zachowywać bezwzględne adresy URL dokumentacji, aby linki działały poza Mintlify.
- Treść dokumentacji musi pozostać ogólna: bez nazw urządzeń osobistych, nazw hostów ani ścieżek lokalnych; używaj symboli zastępczych, takich jak `user@gateway-host`.

## Reguły treści dokumentacji

- W dokumentacji, tekstach UI i listach wyboru porządkuj usługi/dostawców alfabetycznie, chyba że sekcja wyraźnie opisuje kolejność środowiska uruchomieniowego lub kolejność automatycznego wykrywania.
- Zachowaj spójne nazewnictwo dołączonych pluginów z ogólnorepozytoryjnymi regułami terminologii pluginów w głównym `AGENTS.md`.

## Dokumentacja wewnętrzna

- Długoterminowa prywatna dokumentacja operatorska należy do `~/Projects/manager/docs/`.
- Lokalne dla repozytorium wewnętrzne dokumenty robocze/kopie lustrzane mogą znajdować się w ignorowanym `docs/internal/`.
- Nigdy nie dodawaj stron `docs/internal/**` do nawigacji `docs/docs.json` ani nie linkuj do nich z publicznej dokumentacji.
- `scripts/docs-sync-publish.mjs` wyklucza i usuwa `docs/internal/**` z publicznego repozytorium publikacji `openclaw/docs`, jeśli strona zostanie później wymuszona do dodania.
- Dokumentacja wewnętrzna może wspominać ścieżki repozytorium, prywatne nazwy aplikacji, nazwy elementów 1Password i runbooki, ale nigdy nie może zawierać wartości sekretów.

## Edycja karty oceny dojrzałości

`taxonomy.yaml` i `qa/maturity-scores.yaml` są źródłowymi danymi wejściowymi; wygenerowana dokumentacja dojrzałości w `docs/maturity/` jest projekcją i nie powinna być edytowana ręcznie w zakresie punktacji, LTS, taksonomii, profilu QA ani tabel dowodów.
`scripts/qa/render-maturity-docs.ts` odpowiada za generowanie; użyj `pnpm maturity:render`, aby odświeżyć zatwierdzone dokumenty, oraz `pnpm maturity:check`, aby je zweryfikować.
`.github/workflows/maturity-scorecard.yml` renderuje podglądy artefaktów i może otwierać PR-y z wygenerowaną dokumentacją; `.github/workflows/openclaw-release-checks.yml` uruchamia go dla QA wydania.
Przechowuj deterministyczne dane `qa-evidence.json.scorecard` w artefaktach GitHub Actions, chyba że maintainer wyraźnie poprosi o oczyszczoną, zatwierdzoną projekcję.
Ręczne nadpisania muszą zmienić stan źródłowy w PR-ze oraz wyjaśnić powód wraz z publicznymi lub zredagowanymi dowodami.

## i18n dokumentacji

- Dokumentacja w językach obcych nie jest utrzymywana w tym repozytorium. Wygenerowany wynik publikacji znajduje się w osobnym repozytorium `openclaw/docs` (często klonowanym lokalnie jako `../openclaw-docs`).
- Nie dodawaj ani nie edytuj tutaj zlokalizowanej dokumentacji w `docs/<locale>/**`.
- Traktuj angielską dokumentację w tym repozytorium oraz pliki glosariusza jako źródło prawdy.
- Pipeline: zaktualizuj tutaj angielską dokumentację, w razie potrzeby zaktualizuj `docs/.i18n/glossary.<locale>.json`, a następnie pozwól synchronizacji repozytorium publikacji i `scripts/docs-i18n` uruchomić się w `openclaw/docs`.
- Przed ponownym uruchomieniem `scripts/docs-i18n` dodaj wpisy glosariusza dla wszystkich nowych terminów technicznych, tytułów stron lub krótkich etykiet nawigacji, które muszą pozostać po angielsku albo używać stałego tłumaczenia.
- `pnpm docs:check-i18n-glossary` jest zabezpieczeniem dla zmienionych angielskich tytułów dokumentacji i krótkich wewnętrznych etykiet dokumentacji.
- Pamięć tłumaczeniowa znajduje się w wygenerowanych plikach `docs/.i18n/*.tm.jsonl` w repozytorium publikacji.
- Zobacz `docs/.i18n/README.md`.
