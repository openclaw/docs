---
read_when:
    - Chcesz użyć CLI memory-wiki
    - Dokumentujesz lub zmieniasz `openclaw wiki`
summary: Dokumentacja referencyjna CLI dla `openclaw wiki` (status magazynu memory-wiki, wyszukiwanie, kompilowanie, lintowanie, stosowanie, bridge oraz narzędzia pomocnicze Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:24:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspekcja i utrzymanie skarbca `memory-wiki`.

Dostarczane przez dołączony plugin `memory-wiki`.

Powiązane:

- [Plugin Memory Wiki](/pl/plugins/memory-wiki)
- [Omówienie pamięci](/pl/concepts/memory)
- [CLI: pamięć](/pl/cli/memory)

## Do czego służy

Użyj `openclaw wiki`, gdy potrzebujesz skompilowanego skarbca wiedzy z:

- natywnym dla wiki wyszukiwaniem i odczytem stron
- syntezami bogatymi w pochodzenie informacji
- raportami sprzeczności i aktualności
- importami pomostowymi z pluginu aktywnej pamięci
- opcjonalnymi pomocnikami CLI Obsidian

## Typowe polecenia

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
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

Sprawdź bieżący tryb skarbca, jego stan oraz dostępność CLI Obsidian.

Użyj tego najpierw, gdy nie masz pewności, czy skarbiec jest zainicjowany, tryb pomostowy
działa poprawnie albo integracja z Obsidian jest dostępna.

Gdy tryb pomostowy jest aktywny i skonfigurowany do odczytu artefaktów pamięci, to polecenie
odpytuje działający Gateway, dzięki czemu widzi ten sam kontekst pluginu aktywnej pamięci co
pamięć agenta/środowiska uruchomieniowego.

### `wiki doctor`

Uruchom kontrole stanu wiki i pokaż problemy z konfiguracją lub skarbcem.

Gdy tryb pomostowy jest aktywny i skonfigurowany do odczytu artefaktów pamięci, to polecenie
odpytuje działający Gateway przed zbudowaniem raportu. Wyłączone importy pomostowe
oraz konfiguracje pomostu, które nie odczytują artefaktów pamięci, pozostają lokalne/offline.

Typowe problemy obejmują:

- tryb pomostowy włączony bez publicznych artefaktów pamięci
- nieprawidłowy lub brakujący układ skarbca
- brak zewnętrznego CLI Obsidian, gdy oczekiwany jest tryb Obsidian

### `wiki init`

Utwórz układ skarbca wiki i strony startowe.

Inicjuje to strukturę główną, w tym indeksy najwyższego poziomu i katalogi
pamięci podręcznej.

### `wiki ingest <path-or-url>`

Zaimportuj treść do warstwy źródłowej wiki.

Uwagi:

- pobieranie z URL jest kontrolowane przez `ingest.allowUrlIngest`
- zaimportowane strony źródłowe zachowują pochodzenie informacji we frontmatterze
- automatyczna kompilacja może uruchomić się po pobraniu, gdy jest włączona

### `wiki okf import <path>`

Zaimportuj rozpakowany pakiet Open Knowledge Format do stron pojęć wiki.

Importer odczytuje każdy niezarezerwowany dokument pojęcia `.md` w drzewie katalogów OKF,
wymaga niepustego pola `type` i traktuje nieznane wartości `type` OKF jako pojęcia ogólne.
Zarezerwowane pliki OKF `index.md` i `log.md` nie są importowane jako pojęcia.

Zaimportowane strony są spłaszczane pod `concepts/`, dzięki czemu istniejące przepływy
kompilacji, wyszukiwania, pobierania, podsumowań i dashboardów wiki widzą je od razu.
Oryginalny identyfikator pojęcia OKF, `type`, `resource`, `tags`, znacznik czasu, ścieżka
źródłowa i pełny frontmatter są zachowywane we frontmatterze strony. Wewnętrzne linki
Markdown OKF są przepisywane na wygenerowane strony wiki; uszkodzone lub zewnętrzne linki
pozostają bez zmian.

Przykłady:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Odbuduj indeksy, powiązane bloki, dashboardy i skompilowane podsumowania.

Zapisuje to stabilne artefakty przeznaczone dla maszyn pod:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jeśli `render.createDashboards` jest włączone, kompilacja odświeża także strony raportów.

### `wiki lint`

Sprawdź skarbiec i zgłoś:

- problemy strukturalne
- luki w pochodzeniu informacji
- sprzeczności
- otwarte pytania
- strony/tezy o niskiej pewności
- nieaktualne strony/tezy

Uruchom to po istotnych aktualizacjach wiki.

### `wiki search <query>`

Przeszukaj treść wiki.

Zachowanie zależy od konfiguracji:

- `search.backend`: `shared` albo `local`
- `search.corpus`: `wiki`, `memory` albo `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` albo
  `raw-claim`

Użyj `wiki search`, gdy potrzebujesz rankingu specyficznego dla wiki lub szczegółów
pochodzenia informacji. Do jednego szerokiego przebiegu wspólnego przypominania preferuj
`openclaw memory search`, gdy plugin aktywnej pamięci udostępnia wspólne wyszukiwanie.

Tryby wyszukiwania pomagają agentowi wybrać właściwą powierzchnię:

- `find-person`: aliasy, identyfikatory, konta społecznościowe, kanoniczne identyfikatory i strony osób
- `route-question`: wskazówki ask-for/best-used-for oraz kontekst relacji
- `source-evidence`: strony źródłowe i ustrukturyzowane pola dowodowe
- `raw-claim`: ustrukturyzowany tekst tezy z metadanymi tezy/dowodów

Przykłady:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Wyjście tekstowe zawiera wiersze `Claim:` i `Evidence:`, gdy wynik pasuje do
ustrukturyzowanej tezy. Wyjście JSON dodatkowo udostępnia `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` oraz
`evidenceSourceIds` na potrzeby szczegółowej analizy po stronie agenta.

### `wiki get <lookup>`

Odczytaj stronę wiki według identyfikatora lub ścieżki względnej.

Przykłady:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Zastosuj wąskie mutacje bez swobodnego chirurgicznego edytowania strony.

Obsługiwane przepływy obejmują:

- utworzenie/aktualizację strony syntezy
- aktualizację metadanych strony
- dołączanie identyfikatorów źródeł
- dodawanie pytań
- dodawanie sprzeczności
- aktualizację pewności/statusu
- zapis ustrukturyzowanych tez

To polecenie istnieje po to, aby wiki mogła bezpiecznie ewoluować bez ręcznego edytowania
zarządzanych bloków.

### `wiki bridge import`

Zaimportuj publiczne artefakty pamięci z pluginu aktywnej pamięci do stron źródłowych
wspieranych przez pomost.

Użyj tego w trybie `bridge`, gdy chcesz pobrać najnowsze wyeksportowane artefakty pamięci
do skarbca wiki.

Przy aktywnych odczytach artefaktów pomostu CLI kieruje import przez RPC Gateway,
tak aby import używał kontekstu pluginu pamięci środowiska uruchomieniowego. Jeśli importy
pomostowe są wyłączone albo odczyty artefaktów są wyłączone, polecenie zachowuje lokalne/offline
zachowanie zerowego importu.

### `wiki unsafe-local import`

Importuj z jawnie skonfigurowanych ścieżek lokalnych w trybie `unsafe-local`.

Jest to celowo eksperymentalne i przeznaczone tylko dla tej samej maszyny.

### `wiki obsidian ...`

Polecenia pomocnicze Obsidian dla skarbców działających w trybie przyjaznym dla Obsidian.

Podpolecenia:

- `status`
- `search`
- `open`
- `command`
- `daily`

Wymagają one oficjalnego CLI `obsidian` w `PATH`, gdy
`obsidian.useOfficialCli` jest włączone.

## Praktyczne wskazówki użycia

- Użyj `wiki search` + `wiki get`, gdy znaczenie mają pochodzenie informacji i tożsamość strony.
- Użyj `wiki apply` zamiast ręcznego edytowania zarządzanych wygenerowanych sekcji.
- Użyj `wiki lint` przed zaufaniem treściom sprzecznym lub o niskiej pewności.
- Użyj `wiki compile` po importach masowych lub zmianach źródeł, gdy od razu potrzebujesz świeżych
  dashboardów i skompilowanych podsumowań.
- Użyj `wiki okf import`, gdy katalog danych, eksport dokumentacji lub potok wzbogacania agenta
  już emituje pakiety Markdown OKF.
- Użyj `wiki bridge import`, gdy tryb pomostowy zależy od nowo wyeksportowanych artefaktów
  pamięci.

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
