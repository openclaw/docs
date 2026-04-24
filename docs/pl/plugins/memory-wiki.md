---
read_when:
    - Chcesz trwałej wiedzy wykraczającej poza zwykłe notatki `MEMORY.md`
    - Konfigurujesz dołączony Plugin memory-wiki
    - Chcesz zrozumieć `wiki_search`, `wiki_get` lub tryb bridge
summary: 'memory-wiki: skompilowany sejf wiedzy z pochodzeniem, claimami, panelami i trybem bridge'
title: Memory wiki
x-i18n:
    generated_at: "2026-04-24T09:23:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` to dołączony Plugin, który zamienia trwałą pamięć w skompilowany
sejf wiedzy.

**Nie** zastępuje aktywnego Pluginu pamięci. Aktywny Plugin pamięci nadal
zarządza recall, promocją, indeksowaniem i Dreaming. `memory-wiki` działa obok niego
i kompiluje trwałą wiedzę do nawigowalnej wiki z deterministycznymi stronami,
uporządkowanymi claimami, pochodzeniem, panelami i digestami czytelnymi maszynowo.

Używaj go, gdy chcesz, aby pamięć zachowywała się bardziej jak utrzymywana warstwa wiedzy, a
mniej jak stos plików Markdown.

## Co dodaje

- Dedykowany sejf wiki z deterministycznym układem stron
- Uporządkowane metadane claimów i dowodów, a nie tylko prozę
- Pochodzenie, confidence, sprzeczności i otwarte pytania na poziomie stron
- Skompilowane digesty dla konsumentów agent/runtime
- Natywne dla wiki narzędzia search/get/apply/lint
- Opcjonalny tryb bridge, który importuje publiczne artefakty z aktywnego Pluginu pamięci
- Opcjonalny tryb renderowania przyjazny dla Obsidian i integrację CLI

## Jak to pasuje do pamięci

Myśl o tym podziale tak:

| Warstwa                                                 | Zarządza                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Aktywny Plugin pamięci (`memory-core`, QMD, Honcho itd.) | Recall, wyszukiwaniem semantycznym, promocją, Dreaming, runtime pamięci                   |
| `memory-wiki`                                           | Skompilowanymi stronami wiki, syntezami bogatymi w pochodzenie, panelami, natywnym dla wiki search/get/apply |

Jeśli aktywny Plugin pamięci udostępnia współdzielone artefakty recall, OpenClaw może przeszukiwać
obie warstwy w jednym przebiegu przez `memory_search corpus=all`.

Gdy potrzebujesz rankingu specyficznego dla wiki, pochodzenia lub bezpośredniego dostępu do stron, użyj
zamiast tego narzędzi natywnych dla wiki.

## Zalecany wzorzec hybrydowy

Silnym ustawieniem domyślnym dla konfiguracji local-first jest:

- QMD jako aktywny backend pamięci dla recall i szerokiego wyszukiwania semantycznego
- `memory-wiki` w trybie `bridge` dla trwałych, syntetyzowanych stron wiedzy

Ten podział działa dobrze, ponieważ każda warstwa pozostaje skupiona na swoim zadaniu:

- QMD utrzymuje możliwość przeszukiwania surowych notatek, eksportów sesji i dodatkowych kolekcji
- `memory-wiki` kompiluje stabilne encje, claimy, panele i strony źródłowe

Praktyczna zasada:

- używaj `memory_search`, gdy chcesz jednego szerokiego przebiegu recall przez pamięć
- używaj `wiki_search` i `wiki_get`, gdy chcesz wyników wiki uwzględniających pochodzenie
- używaj `memory_search corpus=all`, gdy chcesz, aby współdzielone wyszukiwanie obejmowało obie warstwy

Jeśli tryb bridge zgłasza zero wyeksportowanych artefaktów, aktywny Plugin pamięci
nie udostępnia jeszcze publicznych danych wejściowych bridge. Najpierw uruchom `openclaw wiki doctor`,
a następnie potwierdź, że aktywny Plugin pamięci obsługuje publiczne artefakty.

## Tryby sejfu

`memory-wiki` obsługuje trzy tryby sejfu:

### `isolated`

Własny sejf, własne źródła, brak zależności od `memory-core`.

Użyj tego, gdy chcesz, aby wiki była własnym, kuratorowanym magazynem wiedzy.

### `bridge`

Odczytuje publiczne artefakty pamięci i zdarzenia pamięci z aktywnego Pluginu pamięci
przez publiczne punkty styku SDK Pluginów.

Użyj tego, gdy chcesz, aby wiki kompilowała i porządkowała
wyeksportowane artefakty Pluginu pamięci bez sięgania do prywatnych wnętrzności Pluginu.

Tryb bridge może indeksować:

- wyeksportowane artefakty pamięci
- raporty Dreaming
- notatki dzienne
- pliki główne pamięci
- logi zdarzeń pamięci

### `unsafe-local`

Jawna furtka samej maszyny dla lokalnych prywatnych ścieżek.

Ten tryb jest celowo eksperymentalny i nieprzenośny. Używaj go tylko wtedy, gdy
rozumiesz granicę zaufania i konkretnie potrzebujesz lokalnego dostępu do systemu plików, którego
tryb bridge nie może zapewnić.

## Układ sejfu

Plugin inicjalizuje sejf w taki sposób:

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

Zarządzana treść pozostaje wewnątrz generowanych bloków. Bloki notatek tworzonych przez człowieka są zachowywane.

Główne grupy stron to:

- `sources/` dla zaimportowanych surowych materiałów i stron opartych na bridge
- `entities/` dla trwałych rzeczy, ludzi, systemów, projektów i obiektów
- `concepts/` dla idei, abstrakcji, wzorców i polityk
- `syntheses/` dla skompilowanych podsumowań i utrzymywanych zestawień
- `reports/` dla generowanych paneli

## Uporządkowane claimy i dowody

Strony mogą zawierać w frontmatter uporządkowane `claims`, a nie tylko swobodny tekst.

Każdy claim może zawierać:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Wpisy dowodów mogą zawierać:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

To właśnie sprawia, że wiki działa bardziej jak warstwa przekonań niż pasywny
zrzut notatek. Claimy mogą być śledzone, punktowane, kwestionowane i rozwiązywane z powrotem do źródeł.

## Pipeline kompilacji

Krok kompilacji odczytuje strony wiki, normalizuje podsumowania i emituje stabilne
artefakty skierowane do maszyn w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Te digesty istnieją po to, aby agenci i kod runtime nie musieli skrobać stron
Markdown.

Skompilowane dane wyjściowe zasilają również:

- pierwszy etap indeksowania wiki dla przepływów search/get
- wyszukiwanie po identyfikatorze claim z powrotem do strony właściciela
- zwarte suplementy promptu
- generowanie raportów/paneli

## Panele i raporty stanu

Gdy `render.createDashboards` jest włączone, kompilacja utrzymuje panele w
`reports/`.

Wbudowane raporty obejmują:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Te raporty śledzą między innymi:

- klastry notatek o sprzecznościach
- klastry konkurujących claimów
- claimy bez uporządkowanych dowodów
- strony i claimy o niskim poziomie confidence
- nieaktualność lub nieznaną świeżość
- strony z nierozwiązanymi pytaniami

## Wyszukiwanie i pobieranie

`memory-wiki` obsługuje dwa backendy wyszukiwania:

- `shared`: używa współdzielonego przepływu wyszukiwania pamięci, jeśli jest dostępny
- `local`: przeszukuje wiki lokalnie

Obsługuje też trzy corpora:

- `wiki`
- `memory`
- `all`

Ważne zachowanie:

- `wiki_search` i `wiki_get` używają skompilowanych digestów jako pierwszego przebiegu, gdy to możliwe
- identyfikatory claim mogą rozstrzygać się z powrotem do strony właściciela
- claimy contested/stale/fresh wpływają na ranking
- etykiety pochodzenia mogą przetrwać do wyników

Praktyczna zasada:

- używaj `memory_search corpus=all` dla jednego szerokiego przebiegu recall
- używaj `wiki_search` + `wiki_get`, gdy zależy Ci na rankingu specyficznym dla wiki,
  pochodzeniu lub strukturze przekonań na poziomie strony

## Narzędzia agenta

Plugin rejestruje następujące narzędzia:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Co robią:

- `wiki_status`: bieżący tryb sejfu, stan zdrowia, dostępność CLI Obsidian
- `wiki_search`: przeszukiwanie stron wiki i, gdy skonfigurowane, współdzielonych corpus pamięci
- `wiki_get`: odczyt strony wiki według id/ścieżki albo fallback do współdzielonego corpus pamięci
- `wiki_apply`: wąskie mutacje syntez/metadanych bez dowolnej chirurgii stron
- `wiki_lint`: kontrole strukturalne, luki w pochodzeniu, sprzeczności, otwarte pytania

Plugin rejestruje również niewyłączny suplement corpus pamięci, dzięki czemu współdzielone
`memory_search` i `memory_get` mogą sięgać do wiki, gdy aktywny Plugin pamięci obsługuje wybór corpus.

## Zachowanie promptu i kontekstu

Gdy włączone jest `context.includeCompiledDigestPrompt`, sekcje promptu pamięci
dołączają zwarty skompilowany snapshot z `agent-digest.json`.

Ten snapshot jest celowo mały i o wysokim sygnale:

- tylko najważniejsze strony
- tylko najważniejsze claimy
- liczba sprzeczności
- liczba pytań
- kwalifikatory confidence/freshness

To jest opt-in, ponieważ zmienia kształt promptu i jest przydatne głównie dla
silników kontekstu lub starszego składania promptów, które jawnie konsumują suplementy pamięci.

## Konfiguracja

Umieść konfigurację pod `plugins.entries.memory-wiki.config`:

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
- `bridge.readMemoryArtifacts`: importuj publiczne artefakty aktywnego Pluginu pamięci
- `bridge.followMemoryEvents`: uwzględniaj logi zdarzeń w trybie bridge
- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`
- `context.includeCompiledDigestPrompt`: dołącza zwarty snapshot digestu do sekcji promptu pamięci
- `render.createBacklinks`: generuje deterministyczne bloki powiązane
- `render.createDashboards`: generuje strony paneli

### Przykład: QMD + tryb bridge

Użyj tego, gdy chcesz QMD do recall, a `memory-wiki` jako utrzymywaną
warstwę wiedzy:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

To utrzymuje:

- QMD odpowiedzialne za recall aktywnej pamięci
- `memory-wiki` skupione na skompilowanych stronach i panelach
- niezmieniony kształt promptu, dopóki celowo nie włączysz promptów skompilowanych digestów

## CLI

`memory-wiki` udostępnia również powierzchnię CLI najwyższego poziomu:

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

Pełną dokumentację poleceń znajdziesz w [CLI: wiki](/pl/cli/wiki).

## Obsługa Obsidian

Gdy `vault.renderMode` ma wartość `obsidian`, Plugin zapisuje Markdown przyjazny dla Obsidian
i może opcjonalnie używać oficjalnego CLI `obsidian`.

Obsługiwane przepływy pracy obejmują:

- sprawdzanie stanu
- wyszukiwanie w sejfie
- otwieranie strony
- wywoływanie polecenia Obsidian
- przechodzenie do notatki dziennej

To jest opcjonalne. Wiki nadal działa w trybie natywnym bez Obsidian.

## Zalecany przepływ pracy

1. Zachowaj aktywny Plugin pamięci dla recall/promocji/Dreaming.
2. Włącz `memory-wiki`.
3. Zacznij od trybu `isolated`, chyba że jawnie chcesz trybu bridge.
4. Używaj `wiki_search` / `wiki_get`, gdy liczy się pochodzenie.
5. Używaj `wiki_apply` do wąskich syntez lub aktualizacji metadanych.
6. Uruchamiaj `wiki_lint` po istotnych zmianach.
7. Włącz panele, jeśli chcesz mieć widoczność nieaktualności/sprzeczności.

## Powiązana dokumentacja

- [Przegląd pamięci](/pl/concepts/memory)
- [CLI: memory](/pl/cli/memory)
- [CLI: wiki](/pl/cli/wiki)
- [Przegląd SDK Pluginów](/pl/plugins/sdk-overview)
