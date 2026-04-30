---
read_when:
    - Potrzebujesz trwałej wiedzy wykraczającej poza zwykłe notatki MEMORY.md
    - Konfigurujesz dołączony Plugin memory-wiki
    - Chcesz zrozumieć wiki_search, wiki_get lub tryb mostu
summary: 'memory-wiki: skompilowany magazyn wiedzy z informacjami o pochodzeniu, twierdzeniami, pulpitami i trybem mostu'
title: Wiki pamięci
x-i18n:
    generated_at: "2026-04-30T10:07:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` to dołączony Plugin, który przekształca trwałą pamięć w skompilowany
skarbiec wiedzy.

**Nie** zastępuje on aktywnego Plugin pamięci. Aktywny Plugin pamięci nadal
odpowiada za przywoływanie, promowanie, indeksowanie i dreaming. `memory-wiki` działa obok niego
i kompiluje trwałą wiedzę w nawigowalną wiki z deterministycznymi stronami,
ustrukturyzowanymi twierdzeniami, proweniencją, pulpitami i digestami czytelnymi maszynowo.

Używaj go, gdy chcesz, aby pamięć działała bardziej jak utrzymywana warstwa wiedzy,
a mniej jak stos plików Markdown.

## Co dodaje

- Dedykowany skarbiec wiki z deterministycznym układem stron
- Ustrukturyzowane metadane twierdzeń i dowodów, nie tylko prozę
- Proweniencję na poziomie strony, pewność, sprzeczności i otwarte pytania
- Skompilowane digesty dla konsumentów agenta/środowiska uruchomieniowego
- Natywne dla wiki narzędzia search/get/apply/lint
- Opcjonalny tryb mostu, który importuje publiczne artefakty z aktywnego Plugin pamięci
- Opcjonalny tryb renderowania przyjazny dla Obsidian i integrację z CLI

## Jak pasuje do pamięci

Myśl o tym podziale tak:

| Warstwa                                                 | Odpowiada za                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Aktywny Plugin pamięci (`memory-core`, QMD, Honcho itd.) | Przywoływanie, wyszukiwanie semantyczne, promowanie, dreaming, środowisko uruchomieniowe pamięci |
| `memory-wiki`                                           | Skompilowane strony wiki, syntezy bogate w proweniencję, pulpity, wyszukiwanie/get/apply specyficzne dla wiki |

Jeśli aktywny Plugin pamięci udostępnia współdzielone artefakty przywoływania, OpenClaw może przeszukiwać
obie warstwy jednym przebiegiem za pomocą `memory_search corpus=all`.

Gdy potrzebujesz rankingu specyficznego dla wiki, proweniencji albo bezpośredniego dostępu do strony, użyj
zamiast tego natywnych narzędzi wiki.

## Zalecany wzorzec hybrydowy

Mocnym ustawieniem domyślnym dla konfiguracji local-first jest:

- QMD jako aktywny backend pamięci do przywoływania i szerokiego wyszukiwania semantycznego
- `memory-wiki` w trybie `bridge` dla trwałych, zsyntetyzowanych stron wiedzy

Ten podział działa dobrze, ponieważ każda warstwa pozostaje skupiona:

- QMD utrzymuje możliwość przeszukiwania surowych notatek, eksportów sesji i dodatkowych kolekcji
- `memory-wiki` kompiluje stabilne encje, twierdzenia, pulpity i strony źródłowe

Praktyczna zasada:

- używaj `memory_search`, gdy chcesz jednego szerokiego przebiegu przywoływania po pamięci
- używaj `wiki_search` i `wiki_get`, gdy chcesz wyników wiki świadomych proweniencji
- używaj `memory_search corpus=all`, gdy chcesz, aby współdzielone wyszukiwanie obejmowało obie warstwy

Jeśli tryb mostu zgłasza zero wyeksportowanych artefaktów, aktywny Plugin pamięci
obecnie nie udostępnia jeszcze publicznych wejść mostu. Najpierw uruchom `openclaw wiki doctor`,
a potem potwierdź, że aktywny Plugin pamięci obsługuje publiczne artefakty.

Gdy tryb mostu jest aktywny i `bridge.readMemoryArtifacts` jest włączone,
`openclaw wiki status`, `openclaw wiki doctor` oraz `openclaw wiki bridge
import` czytają przez działający Gateway. Dzięki temu kontrole mostu w CLI są zgodne
z kontekstem Plugin pamięci w środowisku uruchomieniowym. Jeśli most jest wyłączony lub odczyty artefaktów
są wyłączone, te polecenia zachowują swoje lokalne/offline działanie.

## Tryby skarbca

`memory-wiki` obsługuje trzy tryby skarbca:

### `isolated`

Własny skarbiec, własne źródła, brak zależności od `memory-core`.

Użyj tego, gdy chcesz, aby wiki była własnym kuratorowanym magazynem wiedzy.

### `bridge`

Czyta publiczne artefakty pamięci i zdarzenia pamięci z aktywnego Plugin pamięci
przez publiczne szwy SDK Plugin.

Użyj tego, gdy chcesz, aby wiki kompilowała i organizowała wyeksportowane artefakty Plugin pamięci
bez sięgania do prywatnych wnętrz Plugin.

Tryb mostu może indeksować:

- wyeksportowane artefakty pamięci
- raporty snów
- notatki dzienne
- pliki katalogu głównego pamięci
- dzienniki zdarzeń pamięci

### `unsafe-local`

Jawna furtka dla prywatnych ścieżek lokalnych na tej samej maszynie.

Ten tryb jest celowo eksperymentalny i nieprzenośny. Używaj go tylko wtedy, gdy
rozumiesz granicę zaufania i konkretnie potrzebujesz dostępu do lokalnego systemu plików, którego
tryb mostu nie może zapewnić.

## Układ skarbca

Plugin inicjalizuje skarbiec w ten sposób:

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

Zarządzana treść pozostaje wewnątrz wygenerowanych bloków. Bloki notatek ludzkich są zachowywane.

Główne grupy stron to:

- `sources/` dla zaimportowanego surowego materiału i stron opartych na moście
- `entities/` dla trwałych rzeczy, osób, systemów, projektów i obiektów
- `concepts/` dla idei, abstrakcji, wzorców i zasad
- `syntheses/` dla skompilowanych podsumowań i utrzymywanych zestawień
- `reports/` dla wygenerowanych pulpitów

## Ustrukturyzowane twierdzenia i dowody

Strony mogą zawierać ustrukturyzowany frontmatter `claims`, nie tylko tekst swobodny.

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

To sprawia, że wiki działa bardziej jak warstwa przekonań niż pasywny
zrzut notatek. Twierdzenia można śledzić, oceniać, kwestionować i rozwiązywać z powrotem do źródeł.

## Metadane encji dla agentów

Strony encji mogą też zawierać metadane routingu do użytku przez agenta. To ogólny
frontmatter, więc działa dla osób, zespołów, systemów, projektów lub dowolnego innego
typu encji.

Typowe pola obejmują:

- `entityType`: na przykład `person`, `team`, `system` lub `project`
- `canonicalId`: stabilny klucz tożsamości używany między aliasami i importami
- `aliases`: nazwy, uchwyty lub etykiety, które powinny prowadzić do tej samej strony
- `privacyTier`: `public`, `local-private`, `sensitive` lub `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: zwięzłe wskazówki routingu
- `lastRefreshedAt`: znacznik czasu odświeżenia źródła oddzielny od czasu edycji strony
- `personCard`: opcjonalna karta routingu specyficzna dla osoby z uchwytami, profilami społecznościowymi,
  adresami e-mail, strefą czasową, lane, ask-for, avoid-asking-for, pewnością i prywatnością
- `relationships`: typowane krawędzie do powiązanych stron z celem, rodzajem, wagą,
  pewnością, rodzajem dowodu, poziomem prywatności i notatką

W przypadku wiki osób agent powinien zwykle zacząć od
`reports/person-agent-directory.md`, a następnie otworzyć stronę osoby za pomocą `wiki_get`
przed użyciem danych kontaktowych lub wywnioskowanych faktów.

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
artefakty przeznaczone dla maszyn pod:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Te digesty istnieją po to, aby agenci i kod środowiska uruchomieniowego nie musieli analizować
stron Markdown.

Skompilowane wyjście zasila też:

- indeksowanie wiki pierwszego przebiegu dla przepływów search/get
- wyszukiwanie claim-id z powrotem do stron właścicielskich
- zwięzłe dodatki do promptów
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
- konkurujące klastry twierdzeń
- twierdzenia bez ustrukturyzowanych dowodów
- strony i twierdzenia o niskiej pewności
- przestarzałą lub nieznaną świeżość
- strony z nierozwiązanymi pytaniami
- karty routingu osób/encji
- ustrukturyzowane krawędzie relacji
- pokrycie klas dowodów
- niepubliczne poziomy prywatności, które wymagają przeglądu przed użyciem

## Wyszukiwanie i pobieranie

`memory-wiki` obsługuje dwa backendy wyszukiwania:

- `shared`: użyj współdzielonego przepływu wyszukiwania pamięci, gdy jest dostępny
- `local`: przeszukuj wiki lokalnie

Obsługuje też trzy korpusy:

- `wiki`
- `memory`
- `all`

Ważne zachowanie:

- `wiki_search` i `wiki_get` używają skompilowanych digestów jako pierwszego przebiegu, gdy to możliwe
- identyfikatory twierdzeń mogą prowadzić z powrotem do strony właścicielskiej
- kwestionowane/przestarzałe/świeże twierdzenia wpływają na ranking
- etykiety proweniencji mogą przetrwać do wyników
- tryb wyszukiwania może ukierunkować ranking na wyszukiwanie osób, routing pytań, dowody
  źródłowe lub surowe twierdzenia

Praktyczna zasada:

- używaj `memory_search corpus=all` do jednego szerokiego przebiegu przywoływania
- używaj `wiki_search` + `wiki_get`, gdy zależy Ci na rankingu specyficznym dla wiki,
  proweniencji lub strukturze przekonań na poziomie strony

Tryby wyszukiwania:

- `auto`: zrównoważone ustawienie domyślne
- `find-person`: wzmacnia encje przypominające osoby, aliasy, uchwyty, profile społecznościowe i
  identyfikatory kanoniczne
- `route-question`: wzmacnia karty agentów, wskazówki ask-for, wskazówki best-used-for oraz
  kontekst relacji
- `source-evidence`: wzmacnia strony źródłowe i ustrukturyzowane metadane dowodów
- `raw-claim`: wzmacnia pasujące ustrukturyzowane twierdzenia i zwraca metadane twierdzeń/dowodów
  w wynikach

Gdy wynik pasuje do ustrukturyzowanego twierdzenia, `wiki_search` może zwrócić
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` i `evidenceSourceIds` w swoim ładunku szczegółów. Wyjście tekstowe
również zawiera zwięzłe wiersze `Claim:` i `Evidence:`, gdy są dostępne.

## Narzędzia agenta

Plugin rejestruje te narzędzia:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Co robią:

- `wiki_status`: bieżący tryb skarbca, zdrowie, dostępność CLI Obsidian
- `wiki_search`: przeszukuje strony wiki oraz, gdy skonfigurowano, współdzielone korpusy pamięci;
  akceptuje `mode` dla wyszukiwania osób, routingu pytań, dowodów źródłowych lub szczegółowego przejścia
  po surowych twierdzeniach
- `wiki_get`: czyta stronę wiki według id/ścieżki albo wraca do współdzielonego korpusu pamięci
- `wiki_apply`: wąskie mutacje syntezy/metadanych bez swobodnej chirurgii stron
- `wiki_lint`: kontrole strukturalne, luki w proweniencji, sprzeczności, otwarte pytania

Plugin rejestruje też niewyłączny dodatek korpusu pamięci, dzięki czemu współdzielone
`memory_search` i `memory_get` mogą sięgnąć do wiki, gdy aktywny Plugin pamięci
obsługuje wybór korpusu.

## Zachowanie promptu i kontekstu

Gdy `context.includeCompiledDigestPrompt` jest włączone, sekcje promptu pamięci
dołączają zwięzły skompilowany snapshot z `agent-digest.json`.

Ten snapshot jest celowo mały i bogaty w sygnał:

- tylko najważniejsze strony
- tylko najważniejsze twierdzenia
- liczba sprzeczności
- liczba pytań
- kwalifikatory pewności/świeżości

To jest opcjonalne, ponieważ zmienia kształt promptu i jest głównie przydatne dla silników kontekstu
lub starszego składania promptów, które jawnie konsumują dodatki pamięci.

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
- `bridge.readMemoryArtifacts`: importuj publiczne artefakty Pluginu Active Memory
- `bridge.followMemoryEvents`: uwzględniaj dzienniki zdarzeń w trybie bridge
- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`
- `context.includeCompiledDigestPrompt`: dołącz zwięzły zrzut digesta do sekcji promptu pamięci
- `render.createBacklinks`: generuj deterministyczne powiązane bloki
- `render.createDashboards`: generuj strony pulpitów

### Przykład: QMD + tryb bridge

Użyj tego, gdy chcesz używać QMD do przywoływania i `memory-wiki` jako utrzymywanej
warstwy wiedzy:

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

To zachowuje:

- QMD jako mechanizm odpowiedzialny za przywoływanie aktywnej pamięci
- `memory-wiki` skoncentrowane na skompilowanych stronach i pulpitach
- kształt promptu bez zmian, dopóki celowo nie włączysz skompilowanych promptów digesta

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

Pełną dokumentację poleceń znajdziesz w [CLI: wiki](/pl/cli/wiki).

## Obsługa Obsidian

Gdy `vault.renderMode` ma wartość `obsidian`, Plugin zapisuje Markdown przyjazny dla Obsidian
i może opcjonalnie używać oficjalnego CLI `obsidian`.

Obsługiwane przepływy pracy obejmują:

- sprawdzanie statusu
- przeszukiwanie sejfu
- otwieranie strony
- wywoływanie polecenia Obsidian
- przechodzenie do notatki dziennej

To jest opcjonalne. Wiki nadal działa w trybie natywnym bez Obsidian.

## Zalecany przepływ pracy

1. Zachowaj aktywny Plugin pamięci do przywoływania/promocji/dreamingu.
2. Włącz `memory-wiki`.
3. Zacznij od trybu `isolated`, chyba że wyraźnie chcesz użyć trybu bridge.
4. Używaj `wiki_search` / `wiki_get`, gdy pochodzenie ma znaczenie.
5. Używaj `wiki_apply` do wąskich syntez lub aktualizacji metadanych.
6. Uruchom `wiki_lint` po istotnych zmianach.
7. Włącz pulpity, jeśli chcesz widoczności nieaktualnych informacji/sprzeczności.

## Powiązana dokumentacja

- [Omówienie pamięci](/pl/concepts/memory)
- [CLI: memory](/pl/cli/memory)
- [CLI: wiki](/pl/cli/wiki)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
