---
read_when:
    - Chcesz korzystać z CLI memory-wiki
    - Dokumentujesz lub zmieniasz `openclaw wiki`
summary: Dokumentacja referencyjna CLI dla `openclaw wiki` (status skarbca memory-wiki, wyszukiwanie, kompilowanie, lintowanie, stosowanie, most oraz pomocniki Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T09:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Sprawdzaj i utrzymuj sejf `memory-wiki`.

Dostarczane przez dołączony Plugin `memory-wiki`.

Powiązane:

- [Plugin Memory Wiki](/pl/plugins/memory-wiki)
- [Omówienie pamięci](/pl/concepts/memory)
- [CLI: pamięć](/pl/cli/memory)

## Do czego służy

Używaj `openclaw wiki`, gdy potrzebujesz skompilowanego sejfu wiedzy z:

- natywnym dla wiki wyszukiwaniem i odczytem stron
- syntezami bogatymi w pochodzenie informacji
- raportami sprzeczności i świeżości
- importami pomostowymi z aktywnego pluginu pamięci
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
openclaw wiki search "who should I ask about Teams?" --mode route-question
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

Sprawdza bieżący tryb sejfu, stan oraz dostępność CLI Obsidian.

Użyj tego najpierw, gdy nie masz pewności, czy sejf jest zainicjowany, tryb pomostu
działa poprawnie albo integracja z Obsidian jest dostępna.

Gdy tryb pomostu jest aktywny i skonfigurowany do odczytu artefaktów pamięci, to polecenie
odpytuje działający Gateway, dzięki czemu widzi ten sam kontekst aktywnego pluginu pamięci co
pamięć agenta/środowiska uruchomieniowego.

### `wiki doctor`

Uruchamia kontrole stanu wiki i ujawnia problemy z konfiguracją lub sejfem.

Gdy tryb pomostu jest aktywny i skonfigurowany do odczytu artefaktów pamięci, to polecenie
odpytuje działający Gateway przed zbudowaniem raportu. Wyłączone importy pomostowe
oraz konfiguracje pomostu, które nie odczytują artefaktów pamięci, pozostają lokalne/offline.

Typowe problemy obejmują:

- tryb pomostu włączony bez publicznych artefaktów pamięci
- nieprawidłowy lub brakujący układ sejfu
- brak zewnętrznego CLI Obsidian, gdy oczekiwany jest tryb Obsidian

### `wiki init`

Tworzy układ sejfu wiki i strony startowe.

Inicjuje strukturę główną, w tym indeksy najwyższego poziomu oraz katalogi
pamięci podręcznej.

### `wiki ingest <path-or-url>`

Importuje treść do warstwy źródłowej wiki.

Uwagi:

- import z URL jest kontrolowany przez `ingest.allowUrlIngest`
- zaimportowane strony źródłowe zachowują pochodzenie informacji we frontmatter
- automatyczna kompilacja może zostać uruchomiona po imporcie, gdy jest włączona

### `wiki compile`

Przebudowuje indeksy, bloki powiązane, pulpity i skompilowane streszczenia.

Zapisuje stabilne artefakty przeznaczone dla maszyn w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jeśli `render.createDashboards` jest włączone, kompilacja odświeża również strony raportów.

### `wiki lint`

Sprawdza sejf i raportuje:

- problemy strukturalne
- luki w pochodzeniu informacji
- sprzeczności
- otwarte pytania
- strony/tezy o niskiej pewności
- nieaktualne strony/tezy

Uruchom to po istotnych aktualizacjach wiki.

### `wiki search <query>`

Przeszukuje treść wiki.

Zachowanie zależy od konfiguracji:

- `search.backend`: `shared` albo `local`
- `search.corpus`: `wiki`, `memory` albo `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` albo
  `raw-claim`

Używaj `wiki search`, gdy potrzebujesz rankingu specyficznego dla wiki lub szczegółów pochodzenia informacji.
Dla jednego szerokiego współdzielonego przywołania preferuj `openclaw memory search`, gdy
aktywny plugin pamięci udostępnia współdzielone wyszukiwanie.

Tryby wyszukiwania pomagają agentowi wybrać właściwą powierzchnię:

- `find-person`: aliasy, identyfikatory, profile społecznościowe, kanoniczne ID i strony osób
- `route-question`: wskazówki „kogo zapytać”/„najlepsze zastosowanie” oraz kontekst relacji
- `source-evidence`: strony źródłowe i ustrukturyzowane pola dowodów
- `raw-claim`: ustrukturyzowany tekst tezy z metadanymi tezy/dowodów

Przykłady:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Dane wyjściowe tekstowe zawierają wiersze `Claim:` i `Evidence:`, gdy wynik pasuje do
ustrukturyzowanej tezy. Dane wyjściowe JSON dodatkowo ujawniają `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` oraz
`evidenceSourceIds` do dalszej analizy po stronie agenta.

### `wiki get <lookup>`

Odczytuje stronę wiki według identyfikatora lub ścieżki względnej.

Przykłady:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Stosuje wąskie mutacje bez swobodnej chirurgii stron.

Obsługiwane przepływy obejmują:

- utworzenie/aktualizację strony syntezy
- aktualizację metadanych strony
- dołączenie identyfikatorów źródeł
- dodanie pytań
- dodanie sprzeczności
- aktualizację pewności/statusu
- zapis ustrukturyzowanych tez

To polecenie istnieje po to, aby wiki mogła bezpiecznie ewoluować bez ręcznej edycji
zarządzanych bloków.

### `wiki bridge import`

Importuje publiczne artefakty pamięci z aktywnego pluginu pamięci do stron źródłowych
wspieranych przez pomost.

Używaj tego w trybie `bridge`, gdy chcesz pobrać najnowsze wyeksportowane artefakty pamięci
do sejfu wiki.

Dla aktywnych odczytów artefaktów pomostowych CLI kieruje import przez RPC Gateway,
aby import używał kontekstu pluginu pamięci środowiska uruchomieniowego. Jeśli importy pomostowe są
wyłączone albo odczyty artefaktów są wyłączone, polecenie zachowuje lokalne/offline
zachowanie zerowego importu.

### `wiki unsafe-local import`

Importuje z jawnie skonfigurowanych ścieżek lokalnych w trybie `unsafe-local`.

Jest to celowo eksperymentalne i przeznaczone wyłącznie dla tej samej maszyny.

### `wiki obsidian ...`

Polecenia pomocnicze Obsidian dla sejfów działających w trybie przyjaznym dla Obsidian.

Podpolecenia:

- `status`
- `search`
- `open`
- `command`
- `daily`

Wymagają oficjalnego CLI `obsidian` w `PATH`, gdy
`obsidian.useOfficialCli` jest włączone.

## Praktyczne wskazówki użycia

- Używaj `wiki search` + `wiki get`, gdy znaczenie mają pochodzenie informacji i tożsamość strony.
- Używaj `wiki apply` zamiast ręcznej edycji zarządzanych sekcji generowanych.
- Używaj `wiki lint` przed zaufaniem treści sprzecznej lub o niskiej pewności.
- Używaj `wiki compile` po masowych importach lub zmianach źródeł, gdy chcesz natychmiast uzyskać świeże
  pulpity i skompilowane streszczenia.
- Używaj `wiki bridge import`, gdy tryb pomostu zależy od nowo wyeksportowanych artefaktów pamięci.

## Powiązania z konfiguracją

Zachowanie `openclaw wiki` jest kształtowane przez:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Zobacz [Plugin Memory Wiki](/pl/plugins/memory-wiki), aby poznać pełny model konfiguracji.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wiki pamięci](/pl/plugins/memory-wiki)
