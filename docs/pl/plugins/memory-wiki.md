---
read_when:
    - Chcesz mieć trwałą wiedzę wykraczającą poza zwykłe notatki MEMORY.md
    - Konfigurujesz dołączoną wtyczkę memory-wiki
    - Chcesz zrozumieć wiki_search, wiki_get lub tryb mostu
summary: 'memory-wiki: skompilowany sejf wiedzy z pochodzeniem, twierdzeniami, pulpitami i trybem mostu'
title: Wiki pamięci
x-i18n:
    generated_at: "2026-04-08T06:01:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b78dd6a4ef4451dae6b53197bf0c7c2a2ba846b08e4a3a93c1026366b1598d82
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Wiki pamięci

`memory-wiki` to dołączona wtyczka, która zamienia trwałą pamięć w skompilowany
sejf wiedzy.

**Nie** zastępuje aktywnej wtyczki pamięci. Aktywna wtyczka pamięci nadal
odpowiada za przywoływanie, promowanie, indeksowanie i śnienie. `memory-wiki`
działa obok niej i kompiluje trwałą wiedzę do postaci nawigowalnej wiki z
deterministycznymi stronami, uporządkowanymi twierdzeniami, pochodzeniem,
pulpitami i odczytywalnymi maszynowo skrótami.

Używaj jej, gdy chcesz, aby pamięć działała bardziej jak utrzymywana warstwa
wiedzy, a mniej jak stos plików Markdown.

## Co dodaje

- Dedykowany sejf wiki z deterministycznym układem stron
- Uporządkowane metadane twierdzeń i dowodów, a nie tylko tekst opisowy
- Pochodzenie, pewność, sprzeczności i otwarte pytania na poziomie strony
- Skompilowane skróty dla agentów i komponentów środowiska uruchomieniowego
- Natywne dla wiki narzędzia search/get/apply/lint
- Opcjonalny tryb mostu, który importuje publiczne artefakty z aktywnej wtyczki pamięci
- Opcjonalny tryb renderowania przyjazny dla Obsidian oraz integrację z CLI

## Jak współgra z pamięcią

Możesz myśleć o tym podziale w ten sposób:

| Warstwa                                                 | Odpowiada za                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Aktywna wtyczka pamięci (`memory-core`, QMD, Honcho itd.) | Przywoływanie, wyszukiwanie semantyczne, promowanie, śnienie, środowisko pamięci         |
| `memory-wiki`                                           | Skompilowane strony wiki, syntezy bogate w pochodzenie, pulpity, wyszukiwanie/get/apply specyficzne dla wiki |

Jeśli aktywna wtyczka pamięci udostępnia współdzielone artefakty przywoływania,
OpenClaw może przeszukiwać obie warstwy w jednym przebiegu za pomocą
`memory_search corpus=all`.

Gdy potrzebujesz rankingu specyficznego dla wiki, pochodzenia lub
bezpośredniego dostępu do strony, użyj zamiast tego natywnych narzędzi wiki.

## Tryby sejfu

`memory-wiki` obsługuje trzy tryby sejfu:

### `isolated`

Własny sejf, własne źródła, bez zależności od `memory-core`.

Użyj tego trybu, jeśli chcesz, aby wiki była własnym, starannie utrzymywanym
magazynem wiedzy.

### `bridge`

Odczytuje publiczne artefakty pamięci i zdarzenia pamięci z aktywnej wtyczki
pamięci za pośrednictwem publicznych punktów integracji plugin SDK.

Użyj tego trybu, jeśli chcesz, aby wiki kompilowała i porządkowała
wyeksportowane artefakty wtyczki pamięci bez sięgania do prywatnych elementów
wewnętrznych wtyczki.

Tryb mostu może indeksować:

- wyeksportowane artefakty pamięci
- raporty ze snów
- notatki dzienne
- pliki główne pamięci
- dzienniki zdarzeń pamięci

### `unsafe-local`

Jawna furtka ucieczki dla lokalnych prywatnych ścieżek na tej samej maszynie.

Ten tryb jest celowo eksperymentalny i nieprzenośny. Używaj go tylko wtedy, gdy
rozumiesz granicę zaufania i konkretnie potrzebujesz lokalnego dostępu do
systemu plików, którego tryb mostu nie może zapewnić.

## Układ sejfu

Wtyczka inicjalizuje sejf w ten sposób:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Zarządzana zawartość pozostaje wewnątrz wygenerowanych bloków. Bloki notatek
tworzonych przez ludzi są zachowywane.

Główne grupy stron to:

- `sources/` dla zaimportowanego surowego materiału i stron opartych na trybie mostu
- `entities/` dla trwałych rzeczy, osób, systemów, projektów i obiektów
- `concepts/` dla idei, abstrakcji, wzorców i zasad
- `syntheses/` dla skompilowanych podsumowań i utrzymywanych zestawień
- `reports/` dla wygenerowanych pulpitów

## Uporządkowane twierdzenia i dowody

Strony mogą zawierać uporządkowane `claims` we frontmatter, a nie tylko
swobodny tekst.

Każde twierdzenie może zawierać:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Elementy dowodów mogą zawierać:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

To właśnie sprawia, że wiki działa bardziej jak warstwa przekonań niż pasywny
zrzut notatek. Twierdzenia mogą być śledzone, oceniane, kwestionowane i
rozstrzygane z odniesieniem do źródeł.

## Potok kompilacji

Krok kompilacji odczytuje strony wiki, normalizuje podsumowania i zapisuje
stabilne artefakty przeznaczone dla maszyn w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Te skróty istnieją po to, aby agenci i kod środowiska uruchomieniowego nie
musieli analizować stron Markdown.

Skompilowane dane wyjściowe obsługują także:

- pierwszy etap indeksowania wiki dla przepływów search/get
- wyszukiwanie po `claim-id` z powrotem do strony właściciela
- kompaktowe uzupełnienia promptów
- generowanie raportów i pulpitów

## Pulpity i raporty stanu

Gdy włączone jest `render.createDashboards`, kompilacja utrzymuje pulpity w
`reports/`.

Wbudowane raporty obejmują:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Raporty te śledzą takie rzeczy jak:

- klastry notatek o sprzecznościach
- klastry konkurujących twierdzeń
- twierdzenia bez uporządkowanych dowodów
- strony i twierdzenia o niskiej pewności
- nieaktualność lub nieznaną świeżość
- strony z nierozstrzygniętymi pytaniami

## Wyszukiwanie i pobieranie

`memory-wiki` obsługuje dwa backendy wyszukiwania:

- `shared`: używaj współdzielonego przepływu wyszukiwania pamięci, gdy jest dostępny
- `local`: przeszukuj wiki lokalnie

Obsługuje też trzy korpusy:

- `wiki`
- `memory`
- `all`

Ważne zachowanie:

- `wiki_search` i `wiki_get` używają skompilowanych skrótów jako pierwszego etapu, gdy to możliwe
- identyfikatory twierdzeń mogą być rozwiązywane z powrotem do strony właściciela
- kwestionowane/nieaktualne/świeże twierdzenia wpływają na ranking
- etykiety pochodzenia mogą być zachowywane w wynikach

Praktyczna zasada:

- używaj `memory_search corpus=all` do jednego szerokiego przebiegu przywoływania
- używaj `wiki_search` + `wiki_get`, gdy zależy Ci na rankingu specyficznym dla wiki,
  pochodzeniu lub strukturze przekonań na poziomie strony

## Narzędzia agenta

Wtyczka rejestruje następujące narzędzia:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Co robią:

- `wiki_status`: bieżący tryb sejfu, stan, dostępność Obsidian CLI
- `wiki_search`: przeszukiwanie stron wiki oraz, po skonfigurowaniu, współdzielonych korpusów pamięci
- `wiki_get`: odczyt strony wiki według id/ścieżki lub przejście awaryjne do współdzielonego korpusu pamięci
- `wiki_apply`: wąskie mutacje syntez/metadanych bez swobodnej ingerencji w stronę
- `wiki_lint`: kontrole strukturalne, luki w pochodzeniu, sprzeczności, otwarte pytania

Wtyczka rejestruje także niewyłączny dodatek do korpusu pamięci, dzięki czemu
współdzielone `memory_search` i `memory_get` mogą sięgać do wiki, gdy aktywna
wtyczka pamięci obsługuje wybór korpusu.

## Zachowanie promptów i kontekstu

Gdy włączone jest `context.includeCompiledDigestPrompt`, sekcje promptów pamięci
dołączają kompaktowy skompilowany zrzut z `agent-digest.json`.

Ten zrzut jest celowo mały i bogaty w sygnał:

- tylko najważniejsze strony
- tylko najważniejsze twierdzenia
- liczba sprzeczności
- liczba pytań
- kwalifikatory pewności/świeżości

Jest to opcjonalne, ponieważ zmienia kształt promptu i jest przydatne głównie
dla silników kontekstu lub starszego składania promptów, które jawnie
wykorzystują dodatki pamięci.

## Konfiguracja

Umieść konfigurację w `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Kluczowe przełączniki:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` lub `obsidian`
- `bridge.readMemoryArtifacts`: import publicznych artefaktów aktywnej wtyczki pamięci
- `bridge.followMemoryEvents`: uwzględnianie dzienników zdarzeń w trybie mostu
- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`
- `context.includeCompiledDigestPrompt`: dołączanie kompaktowego zrzutu skrótu do sekcji promptów pamięci
- `render.createBacklinks`: generowanie deterministycznych bloków powiązań
- `render.createDashboards`: generowanie stron pulpitów

## CLI

`memory-wiki` udostępnia również interfejs CLI najwyższego poziomu:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Pełne omówienie poleceń znajdziesz w [CLI: wiki](/cli/wiki).

## Obsługa Obsidian

Gdy `vault.renderMode` ma wartość `obsidian`, wtyczka zapisuje Markdown
przyjazny dla Obsidian i może opcjonalnie używać oficjalnego `obsidian` CLI.

Obsługiwane przepływy pracy obejmują:

- sprawdzanie stanu
- przeszukiwanie sejfu
- otwieranie strony
- wywoływanie polecenia Obsidian
- przechodzenie do notatki dziennej

To opcjonalne. Wiki nadal działa w trybie natywnym bez Obsidian.

## Zalecany przepływ pracy

1. Zachowaj aktywną wtyczkę pamięci do przywoływania/promowania/śnienia.
2. Włącz `memory-wiki`.
3. Zacznij od trybu `isolated`, chyba że jawnie chcesz używać trybu mostu.
4. Używaj `wiki_search` / `wiki_get`, gdy pochodzenie ma znaczenie.
5. Używaj `wiki_apply` do wąskich syntez lub aktualizacji metadanych.
6. Uruchamiaj `wiki_lint` po istotnych zmianach.
7. Włącz pulpity, jeśli chcesz mieć widoczność nieaktualności/sprzeczności.

## Powiązane dokumenty

- [Przegląd pamięci](/pl/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
