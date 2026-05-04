---
read_when:
    - Chcesz trwałej wiedzy wykraczającej poza zwykłe notatki MEMORY.md
    - Konfigurujesz dołączony Plugin memory-wiki
    - Chcesz zrozumieć wiki_search, wiki_get lub tryb mostka
summary: 'memory-wiki: skompilowany magazyn wiedzy z pochodzeniem danych, twierdzeniami, panelami i trybem mostka'
title: Wiki pamięci
x-i18n:
    generated_at: "2026-05-04T02:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` to wbudowany plugin, który przekształca trwałą pamięć w skompilowany
magazyn wiedzy.

Nie zastępuje **aktywnego pluginu pamięci**. Aktywny plugin pamięci nadal
odpowiada za przywoływanie, promowanie, indeksowanie i Dreaming. `memory-wiki`
działa obok niego i kompiluje trwałą wiedzę w nawigowalną wiki z deterministycznymi
stronami, strukturalnymi twierdzeniami, pochodzeniem, pulpitami oraz digestami
czytelnymi maszynowo.

Użyj go, gdy chcesz, aby pamięć działała bardziej jak utrzymywana warstwa wiedzy,
a mniej jak stos plików Markdown.

## Co dodaje

- Dedykowany magazyn wiki z deterministycznym układem stron
- Strukturalne metadane twierdzeń i dowodów, nie tylko prozę
- Pochodzenie, pewność, sprzeczności i otwarte pytania na poziomie strony
- Skompilowane digesty dla agentów i konsumentów runtime
- Natywne dla wiki narzędzia search/get/apply/lint
- Opcjonalny tryb mostu, który importuje publiczne artefakty z aktywnego pluginu pamięci
- Opcjonalny tryb renderowania przyjazny Obsidianowi i integrację z CLI

## Jak pasuje do pamięci

Pomyśl o tym podziale tak:

| Warstwa                                                 | Odpowiada za                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Aktywny plugin pamięci (`memory-core`, QMD, Honcho itd.) | Przywoływanie, wyszukiwanie semantyczne, promowanie, Dreaming, runtime pamięci             |
| `memory-wiki`                                           | Skompilowane strony wiki, syntezy z bogatym pochodzeniem, pulpity, wiki search/get/apply   |

Jeśli aktywny plugin pamięci udostępnia współdzielone artefakty przywoływania,
OpenClaw może przeszukiwać obie warstwy jednym przebiegiem za pomocą
`memory_search corpus=all`.

Gdy potrzebujesz rankingu specyficznego dla wiki, pochodzenia albo bezpośredniego
dostępu do strony, użyj zamiast tego natywnych narzędzi wiki.

## Zalecany wzorzec hybrydowy

Dobrym ustawieniem domyślnym dla konfiguracji local-first jest:

- QMD jako aktywny backend pamięci do przywoływania i szerokiego wyszukiwania semantycznego
- `memory-wiki` w trybie `bridge` dla trwałych stron z syntetyzowaną wiedzą

Ten podział działa dobrze, ponieważ każda warstwa zachowuje koncentrację:

- QMD utrzymuje możliwość wyszukiwania surowych notatek, eksportów sesji i dodatkowych kolekcji
- `memory-wiki` kompiluje stabilne encje, twierdzenia, pulpity i strony źródłowe

Praktyczna zasada:

- używaj `memory_search`, gdy chcesz jednego szerokiego przebiegu przywoływania przez pamięć
- używaj `wiki_search` i `wiki_get`, gdy chcesz wyników wiki świadomych pochodzenia
- używaj `memory_search corpus=all`, gdy chcesz, aby współdzielone wyszukiwanie obejmowało obie warstwy

Jeśli tryb mostu zgłasza zero wyeksportowanych artefaktów, aktywny plugin pamięci
nie udostępnia obecnie publicznych wejść mostu. Najpierw uruchom
`openclaw wiki doctor`, a potem potwierdź, że aktywny plugin pamięci obsługuje
publiczne artefakty.

Gdy tryb mostu jest aktywny i `bridge.readMemoryArtifacts` jest włączone,
`openclaw wiki status`, `openclaw wiki doctor` oraz `openclaw wiki bridge
import` czytają przez działający Gateway. Dzięki temu kontrole mostu w CLI są
zgodne z kontekstem runtime pluginu pamięci. Jeśli most jest wyłączony albo
odczyty artefaktów są wyłączone, te polecenia zachowują swoje lokalne/offline
działanie.

## Tryby magazynu

`memory-wiki` obsługuje trzy tryby magazynu:

### `isolated`

Własny magazyn, własne źródła, brak zależności od `memory-core`.

Użyj tego, gdy chcesz, aby wiki była własnym, kuratorowanym magazynem wiedzy.

### `bridge`

Czyta publiczne artefakty pamięci i zdarzenia pamięci z aktywnego pluginu pamięci
przez publiczne styki plugin SDK.

Użyj tego, gdy chcesz, aby wiki kompilowała i organizowała wyeksportowane
artefakty pluginu pamięci bez sięgania do prywatnych elementów wewnętrznych
pluginu.

Tryb mostu może indeksować:

- wyeksportowane artefakty pamięci
- raporty snów
- notatki dzienne
- pliki główne pamięci
- dzienniki zdarzeń pamięci

### `unsafe-local`

Jawna furtka dla prywatnych ścieżek lokalnych na tej samej maszynie.

Ten tryb jest celowo eksperymentalny i nieprzenośny. Używaj go tylko wtedy, gdy
rozumiesz granicę zaufania i konkretnie potrzebujesz dostępu do lokalnego systemu
plików, którego tryb mostu nie może zapewnić.

## Układ magazynu

Plugin inicjalizuje magazyn tak:

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
ludzkich są zachowywane.

Główne grupy stron to:

- `sources/` dla zaimportowanego surowego materiału i stron opartych na moście
- `entities/` dla trwałych rzeczy, osób, systemów, projektów i obiektów
- `concepts/` dla idei, abstrakcji, wzorców i zasad
- `syntheses/` dla skompilowanych podsumowań i utrzymywanych zestawień
- `reports/` dla wygenerowanych pulpitów

## Strukturalne twierdzenia i dowody

Strony mogą mieć strukturalny frontmatter `claims`, nie tylko tekst swobodny.

Każde twierdzenie może zawierać:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Wpisy dowodów mogą zawierać:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

To właśnie sprawia, że wiki działa bardziej jak warstwa przekonań niż pasywny
zrzut notatek. Twierdzenia mogą być śledzone, punktowane, kwestionowane i
rozwiązywane z powrotem do źródeł.

## Metadane encji dla agentów

Strony encji mogą też zawierać metadane routingu do użytku agentów. To generyczny
frontmatter, więc działa dla osób, zespołów, systemów, projektów lub dowolnego
innego typu encji.

Typowe pola obejmują:

- `entityType`: na przykład `person`, `team`, `system` lub `project`
- `canonicalId`: stabilny klucz tożsamości używany między aliasami i importami
- `aliases`: nazwy, uchwyty lub etykiety, które powinny wskazywać tę samą stronę
- `privacyTier`: `public`, `local-private`, `sensitive` lub `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: zwarte wskazówki routingu
- `lastRefreshedAt`: znacznik czasu odświeżenia źródła odrębny od czasu edycji strony
- `personCard`: opcjonalna karta routingu specyficzna dla osoby z uchwytami, profilami społecznościowymi,
  adresami e-mail, strefą czasową, ścieżką, ask-for, avoid-asking-for, pewnością i prywatnością
- `relationships`: typowane krawędzie do powiązanych stron z celem, rodzajem, wagą,
  pewnością, rodzajem dowodu, poziomem prywatności i notatką

W przypadku wiki osób agent powinien zwykle zacząć od
`reports/person-agent-directory.md`, a następnie otworzyć stronę osoby za pomocą
`wiki_get`, zanim użyje danych kontaktowych lub wywnioskowanych faktów.

Przykład:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Potok kompilacji

Krok kompilacji czyta strony wiki, normalizuje podsumowania i emituje stabilne
artefakty przeznaczone dla maszyn w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Te digesty istnieją po to, aby agenci i kod runtime nie musieli scrapować stron
Markdown.

Skompilowane wyjście zasila także:

- pierwszoprzebiegowe indeksowanie wiki dla przepływów search/get
- wyszukiwanie identyfikatora twierdzenia z powrotem do strony właścicielskiej
- zwarte dodatki do promptów
- generowanie raportów/pulpitów

## Pulpity i raporty zdrowia

Gdy `render.createDashboards` jest włączone, kompilacja utrzymuje pulpity w
`reports/`.

Wbudowane raporty obejmują:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Te raporty śledzą takie rzeczy jak:

- klastry notatek o sprzecznościach
- klastry konkurujących twierdzeń
- twierdzenia bez strukturalnych dowodów
- strony i twierdzenia o niskiej pewności
- nieaktualna lub nieznana świeżość
- strony z nierozwiązanymi pytaniami
- karty routingu osób/encji
- strukturalne krawędzie relacji
- pokrycie klas dowodów
- niepubliczne poziomy prywatności, które wymagają przeglądu przed użyciem

## Wyszukiwanie i pobieranie

`memory-wiki` obsługuje dwa backendy wyszukiwania:

- `shared`: używa współdzielonego przepływu wyszukiwania pamięci, gdy jest dostępny
- `local`: przeszukuje wiki lokalnie

Obsługuje też trzy korpusy:

- `wiki`
- `memory`
- `all`

Ważne zachowanie:

- `wiki_search` i `wiki_get` używają skompilowanych digestów jako pierwszego przebiegu, gdy to możliwe
- identyfikatory twierdzeń mogą wskazywać z powrotem stronę właścicielską
- kwestionowane/nieaktualne/świeże twierdzenia wpływają na ranking
- etykiety pochodzenia mogą przetrwać do wyników
- tryb wyszukiwania może ukierunkować ranking na wyszukiwanie osoby, routing pytania, dowody
  źródłowe lub surowe twierdzenia

Praktyczna zasada:

- używaj `memory_search corpus=all` do jednego szerokiego przebiegu przywoływania
- używaj `wiki_search` + `wiki_get`, gdy zależy Ci na rankingu specyficznym dla wiki,
  pochodzeniu lub strukturze przekonań na poziomie strony

Tryby wyszukiwania:

- `auto`: zrównoważona wartość domyślna
- `find-person`: wzmacnia encje podobne do osób, aliasy, uchwyty, profile społecznościowe i
  kanoniczne identyfikatory
- `route-question`: wzmacnia karty agentów, wskazówki ask-for, wskazówki best-used-for i
  kontekst relacji
- `source-evidence`: wzmacnia strony źródłowe i strukturalne metadane dowodów
- `raw-claim`: wzmacnia dopasowane strukturalne twierdzenia i zwraca metadane twierdzeń/dowodów
  w wynikach

Gdy wynik pasuje do strukturalnego twierdzenia, `wiki_search` może zwrócić
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` i `evidenceSourceIds` w swoim ładunku szczegółów. Wyjście tekstowe
zawiera także zwarte wiersze `Claim:` i `Evidence:`, gdy są dostępne.

## Narzędzia agentów

Plugin rejestruje te narzędzia:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Co robią:

- `wiki_status`: bieżący tryb magazynu, zdrowie, dostępność Obsidian CLI
- `wiki_search`: przeszukuje strony wiki oraz, gdy skonfigurowano, współdzielone korpusy pamięci;
  akceptuje `mode` do wyszukiwania osób, routingu pytań, dowodów źródłowych lub drążenia
  surowych twierdzeń
- `wiki_get`: czyta stronę wiki według identyfikatora/ścieżki albo wraca do współdzielonego korpusu pamięci
- `wiki_apply`: wąskie mutacje syntezy/metadanych bez swobodnej chirurgii strony
- `wiki_lint`: kontrole strukturalne, luki pochodzenia, sprzeczności, otwarte pytania

Plugin rejestruje też niewyłączny dodatek korpusu pamięci, więc współdzielone
`memory_search` i `memory_get` mogą sięgać do wiki, gdy aktywny plugin pamięci
obsługuje wybór korpusu.

## Zachowanie promptu i kontekstu

Gdy `context.includeCompiledDigestPrompt` jest włączone, sekcje promptu pamięci
dołączają zwarty skompilowany snapshot z `agent-digest.json`.

Ten snapshot jest celowo mały i wysokosygnałowy:

- tylko najważniejsze strony
- tylko najważniejsze twierdzenia
- liczba sprzeczności
- liczba pytań
- kwalifikatory pewności/świeżości

Jest to opcjonalne, ponieważ zmienia kształt promptu i jest głównie przydatne dla
silników kontekstu lub starszego składania promptów, które jawnie konsumują
dodatki pamięci.

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
- `bridge.readMemoryArtifacts`: importuj publiczne artefakty pluginu aktywnej pamięci
- `bridge.followMemoryEvents`: uwzględniaj dzienniki zdarzeń w trybie bridge
- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`
- `context.includeCompiledDigestPrompt`: dołącz kompaktową migawkę digest do sekcji promptu pamięci
- `render.createBacklinks`: generuj deterministyczne powiązane bloki
- `render.createDashboards`: generuj strony pulpitów

### Przykład: QMD + tryb bridge

Użyj tego, gdy chcesz używać QMD do przypominania i `memory-wiki` jako utrzymywanej
warstwy wiedzy:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

To zachowuje:

- QMD jako odpowiedzialne za przypominanie aktywnej pamięci
- `memory-wiki` skupione na skompilowanych stronach i pulpitach
- kształt promptu bez zmian, dopóki celowo nie włączysz promptów skompilowanego digest

## CLI

`memory-wiki` udostępnia też powierzchnię CLI najwyższego poziomu:

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

Zobacz [CLI: wiki](/pl/cli/wiki), aby uzyskać pełny opis poleceń.

## Obsługa Obsidian

Gdy `vault.renderMode` ma wartość `obsidian`, plugin zapisuje Markdown przyjazny dla Obsidian
i może opcjonalnie używać oficjalnego CLI `obsidian`.

Obsługiwane przepływy pracy obejmują:

- sprawdzanie statusu
- wyszukiwanie w vault
- otwieranie strony
- wywoływanie polecenia Obsidian
- przechodzenie do notatki dziennej

To jest opcjonalne. Wiki nadal działa w trybie native bez Obsidian.

## Zalecany przepływ pracy

1. Zachowaj plugin aktywnej pamięci do przypominania/promowania/Dreaming.
2. Włącz `memory-wiki`.
3. Zacznij od trybu `isolated`, chyba że wyraźnie chcesz używać trybu bridge.
4. Używaj `wiki_search` / `wiki_get`, gdy pochodzenie ma znaczenie.
5. Używaj `wiki_apply` do wąskich syntez lub aktualizacji metadanych.
6. Uruchom `wiki_lint` po istotnych zmianach.
7. Włącz pulpity, jeśli chcesz widoczności nieaktualnych danych/sprzeczności.

## Powiązana dokumentacja

- [Przegląd pamięci](/pl/concepts/memory)
- [CLI: pamięć](/pl/cli/memory)
- [CLI: wiki](/pl/cli/wiki)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
