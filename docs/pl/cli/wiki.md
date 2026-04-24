---
read_when:
    - Chcesz używać CLI pamięci-wiki
    - Dokumentujesz lub zmieniasz `openclaw wiki`
summary: Dokumentacja CLI dla `openclaw wiki` (stan sejfu pamięci-wiki, wyszukiwanie, kompilacja, lint, apply, bridge i pomocniki Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T09:04:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Sprawdzaj i utrzymuj sejf `memory-wiki`.

Dostarczane przez dołączony Plugin `memory-wiki`.

Powiązane:

- [Plugin Memory Wiki](/pl/plugins/memory-wiki)
- [Przegląd pamięci](/pl/concepts/memory)
- [CLI: memory](/pl/cli/memory)

## Do czego to służy

Użyj `openclaw wiki`, gdy chcesz skompilowany sejf wiedzy z:

- wyszukiwaniem natywnym dla wiki i odczytem stron
- syntezami bogatymi w pochodzenie
- raportami sprzeczności i aktualności
- importami bridge z aktywnego Pluginu pamięci
- opcjonalnymi pomocnikami CLI Obsidian

## Typowe polecenia

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Polecenia

### `wiki status`

Sprawdź bieżący tryb sejfu, stan zdrowia i dostępność CLI Obsidian.

Użyj tego najpierw, gdy nie masz pewności, czy sejf został zainicjalizowany, tryb bridge
działa prawidłowo lub integracja z Obsidian jest dostępna.

### `wiki doctor`

Uruchom kontrole stanu wiki i pokaż problemy z konfiguracją lub sejfem.

Typowe problemy obejmują:

- włączony tryb bridge bez publicznych artefaktów pamięci
- nieprawidłowy lub brakujący układ sejfu
- brak zewnętrznego CLI Obsidian, gdy oczekiwany jest tryb Obsidian

### `wiki init`

Utwórz układ sejfu wiki i strony startowe.

To inicjalizuje strukturę katalogu głównego, w tym indeksy najwyższego poziomu i katalogi cache.

### `wiki ingest <path-or-url>`

Zaimportuj treść do warstwy źródłowej wiki.

Uwagi:

- import URL jest kontrolowany przez `ingest.allowUrlIngest`
- importowane strony źródłowe zachowują pochodzenie we frontmatter
- przy włączeniu może uruchomić się automatyczna kompilacja po imporcie

### `wiki compile`

Przebuduj indeksy, powiązane bloki, panele i skompilowane digesty.

To zapisuje stabilne artefakty skierowane do maszyn w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jeśli włączone jest `render.createDashboards`, kompilacja odświeża również strony raportów.

### `wiki lint`

Wykonaj lint sejfu i zgłoś:

- problemy strukturalne
- luki w pochodzeniu
- sprzeczności
- otwarte pytania
- strony/claimy o niskim poziomie pewności
- nieaktualne strony/claimy

Uruchom to po istotnych aktualizacjach wiki.

### `wiki search <query>`

Przeszukuj treść wiki.

Zachowanie zależy od konfiguracji:

- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`

Użyj `wiki search`, gdy chcesz rankingu specyficznego dla wiki lub szczegółów pochodzenia.
Dla jednego szerokiego współdzielonego przebiegu recall preferuj `openclaw memory search`, gdy
aktywny Plugin pamięci udostępnia współdzielone wyszukiwanie.

### `wiki get <lookup>`

Odczytaj stronę wiki według identyfikatora lub ścieżki względnej.

Przykłady:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Zastosuj wąskie mutacje bez dowolnej chirurgii stron.

Obsługiwane przepływy obejmują:

- tworzenie/aktualizację strony syntezy
- aktualizację metadanych strony
- dołączanie identyfikatorów źródeł
- dodawanie pytań
- dodawanie sprzeczności
- aktualizację confidence/status
- zapisywanie uporządkowanych claimów

To polecenie istnieje po to, aby wiki mogła bezpiecznie ewoluować bez ręcznej edycji
zarządzanych bloków.

### `wiki bridge import`

Importuj publiczne artefakty pamięci z aktywnego Pluginu pamięci do stron źródłowych
opartych na bridge.

Użyj tego w trybie `bridge`, gdy chcesz pobrać do sejfu wiki najnowsze wyeksportowane
artefakty pamięci.

### `wiki unsafe-local import`

Importuj z jawnie skonfigurowanych lokalnych ścieżek w trybie `unsafe-local`.

To jest celowo eksperymentalne i działa tylko na tej samej maszynie.

### `wiki obsidian ...`

Polecenia pomocnicze Obsidian dla sejfów działających w trybie przyjaznym dla Obsidian.

Podpolecenia:

- `status`
- `search`
- `open`
- `command`
- `daily`

Wymagają oficjalnego CLI `obsidian` na `PATH`, gdy
włączone jest `obsidian.useOfficialCli`.

## Praktyczne wskazówki użycia

- Używaj `wiki search` + `wiki get`, gdy liczą się pochodzenie i tożsamość strony.
- Używaj `wiki apply` zamiast ręcznie edytować zarządzane sekcje generowane.
- Używaj `wiki lint` przed zaufaniem treściom sprzecznym lub o niskim poziomie pewności.
- Używaj `wiki compile` po zbiorczych importach lub zmianach źródeł, gdy chcesz od razu mieć świeże
  panele i skompilowane digesty.
- Używaj `wiki bridge import`, gdy tryb bridge zależy od nowo wyeksportowanych
  artefaktów pamięci.

## Powiązania z konfiguracją

Zachowanie `openclaw wiki` jest kształtowane przez:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Pełny model konfiguracji znajdziesz w [Pluginie Memory Wiki](/pl/plugins/memory-wiki).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Memory wiki](/pl/plugins/memory-wiki)
