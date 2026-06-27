---
read_when:
    - Chcesz trwałej wiedzy wykraczającej poza zwykłe notatki MEMORY.md
    - Konfigurujesz dołączony Plugin memory-wiki
    - Chcesz zrozumieć wiki_search, wiki_get lub tryb mostu
summary: 'memory-wiki: skompilowany magazyn wiedzy z pochodzeniem, twierdzeniami, pulpitami i trybem pomostu'
title: Wiki pamięci
x-i18n:
    generated_at: "2026-06-27T17:55:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` to dołączony plugin, który przekształca trwałą pamięć w skompilowany
skarbiec wiedzy.

Nie zastępuje on pluginu aktywnej pamięci. Plugin aktywnej pamięci nadal
odpowiada za przywoływanie, promowanie, indeksowanie i Dreaming. `memory-wiki` działa obok niego
i kompiluje trwałą wiedzę do przeglądalnej wiki z deterministycznymi stronami,
ustrukturyzowanymi twierdzeniami, pochodzeniem, panelami kontrolnymi i streszczeniami czytelnymi maszynowo.

Użyj go, gdy chcesz, aby pamięć zachowywała się bardziej jak utrzymywana warstwa wiedzy,
a mniej jak stos plików Markdown.

## Co dodaje

- Dedykowany skarbiec wiki z deterministycznym układem stron
- Ustrukturyzowane metadane twierdzeń i dowodów, nie tylko prozę
- Pochodzenie, pewność, sprzeczności i otwarte pytania na poziomie strony
- Skompilowane streszczenia dla odbiorców po stronie agentów/środowiska wykonawczego
- Natywne dla wiki narzędzia wyszukiwania/pobierania/stosowania/lintowania
- Importy Open Knowledge Format do skompilowanych pojęć wiki
- Opcjonalny tryb pomostowy importujący publiczne artefakty z pluginu aktywnej pamięci
- Opcjonalny tryb renderowania przyjazny dla Obsidian i integrację z CLI

## Jak pasuje do pamięci

Podział można rozumieć tak:

| Warstwa                                                   | Odpowiada za                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin aktywnej pamięci (`memory-core`, QMD, Honcho itd.) | Przywoływanie, wyszukiwanie semantyczne, promowanie, Dreaming, środowisko wykonawcze pamięci                               |
| `memory-wiki`                                           | Skompilowane strony wiki, syntezy bogate w pochodzenie, panele kontrolne, wyszukiwanie/pobieranie/stosowanie specyficzne dla wiki |

Jeśli plugin aktywnej pamięci udostępnia współdzielone artefakty przywoływania, OpenClaw może przeszukiwać
obie warstwy w jednym przebiegu za pomocą `memory_search corpus=all`.

Gdy potrzebujesz rankingu specyficznego dla wiki, pochodzenia lub bezpośredniego dostępu do strony, użyj
zamiast tego narzędzi natywnych dla wiki.

## Zalecany wzorzec hybrydowy

Mocnym ustawieniem domyślnym dla konfiguracji lokalnych jest:

- QMD jako backend aktywnej pamięci do przywoływania i szerokiego wyszukiwania semantycznego
- `memory-wiki` w trybie `bridge` dla trwałych, syntetyzowanych stron wiedzy

Ten podział działa dobrze, ponieważ każda warstwa pozostaje skupiona:

- QMD utrzymuje przeszukiwalne surowe notatki, eksporty sesji i dodatkowe kolekcje
- `memory-wiki` kompiluje stabilne encje, twierdzenia, panele kontrolne i strony źródłowe

Praktyczna zasada:

- używaj `memory_search`, gdy chcesz wykonać jeden szeroki przebieg przywoływania przez pamięć
- używaj `wiki_search` i `wiki_get`, gdy chcesz wyników wiki świadomych pochodzenia
- używaj `memory_search corpus=all`, gdy chcesz, aby współdzielone wyszukiwanie obejmowało obie warstwy

Jeśli tryb pomostowy zgłasza zero wyeksportowanych artefaktów, plugin aktywnej pamięci
nie udostępnia jeszcze obecnie publicznych wejść pomostowych. Najpierw uruchom `openclaw wiki doctor`,
a potem potwierdź, że plugin aktywnej pamięci obsługuje publiczne artefakty.

Gdy tryb pomostowy jest aktywny, a `bridge.readMemoryArtifacts` jest włączone,
`openclaw wiki status`, `openclaw wiki doctor` oraz `openclaw wiki bridge
import` odczytują przez działający Gateway. Dzięki temu kontrole pomostowe CLI są zgodne
z kontekstem pluginu pamięci w środowisku wykonawczym. Jeśli most jest wyłączony albo odczyty artefaktów
są wyłączone, te polecenia zachowują swoje lokalne/offline zachowanie.

## Tryby skarbca

`memory-wiki` obsługuje trzy tryby skarbca:

### `isolated`

Własny skarbiec, własne źródła, bez zależności od `memory-core`.

Użyj tego, gdy chcesz, aby wiki była własnym, kuratorowanym magazynem wiedzy.

### `bridge`

Odczytuje publiczne artefakty pamięci i zdarzenia pamięci z pluginu aktywnej pamięci
przez publiczne granice SDK pluginów.

Użyj tego, gdy chcesz, aby wiki kompilowała i porządkowała wyeksportowane artefakty pluginu pamięci
bez sięgania do prywatnych wewnętrznych elementów pluginu.

Tryb pomostowy może indeksować:

- wyeksportowane artefakty pamięci
- raporty snów
- dzienne notatki
- pliki główne pamięci
- dzienniki zdarzeń pamięci

### `unsafe-local`

Jawna furtka na tej samej maszynie dla lokalnych ścieżek prywatnych.

Ten tryb jest celowo eksperymentalny i nieprzenośny. Używaj go tylko wtedy, gdy
rozumiesz granicę zaufania i konkretnie potrzebujesz dostępu do lokalnego systemu plików, którego
tryb pomostowy nie może zapewnić.

## Układ skarbca

Plugin inicjuje skarbiec w ten sposób:

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

Zarządzana treść pozostaje wewnątrz wygenerowanych bloków. Bloki ludzkich notatek są zachowywane.

Główne grupy stron to:

- `sources/` dla zaimportowanych surowych materiałów i stron opartych na moście
- `entities/` dla trwałych rzeczy, osób, systemów, projektów i obiektów
- `concepts/` dla idei, abstrakcji, wzorców i zasad
- `syntheses/` dla skompilowanych podsumowań i utrzymywanych zestawień
- `reports/` dla wygenerowanych paneli kontrolnych

## Importy Open Knowledge Format

`memory-wiki` może importować rozpakowane pakiety Open Knowledge Format za pomocą:

```bash
openclaw wiki okf import ./bundles/ga4
```

To najczystsze dopasowanie, gdy katalog danych, crawler dokumentacji lub
agent wzbogacający już produkuje OKF: zachowaj OKF jako przenośny artefakt wymiany,
a następnie pozwól `memory-wiki` przekształcić go w natywne dla OpenClaw strony pojęć i
skompilowane streszczenia.

Importer podąża za strukturą OKF v0.1:

- niezastrzeżone pliki `.md` są dokumentami pojęć
- każde zaimportowane pojęcie wymaga niepustego pola frontmatter `type`
- nieznane wartości OKF `type` są akceptowane
- zastrzeżone pliki `index.md` i `log.md` nie są importowane jako pojęcia
- uszkodzone lub zewnętrzne linki Markdown są zachowywane

Zaimportowane strony pojęć są spłaszczane pod `concepts/`, aby istniejące ścieżki kompilowania,
wyszukiwania, pobierania, paneli kontrolnych i streszczeń promptów widziały je bez dodawania drugiego
drzewa wiki. Każda strona zachowuje oryginalny identyfikator pojęcia OKF, ścieżkę źródłową, `type`,
`resource`, `tags`, znacznik czasu i pełny frontmatter producenta. Wewnętrzne linki OKF
są przepisywane do wygenerowanych stron pojęć wiki i emitowane także jako ustrukturyzowane
wpisy `relationships` z `kind: okf-link`.

## Ustrukturyzowane twierdzenia i dowody

Strony mogą zawierać ustrukturyzowany frontmatter `claims`, nie tylko swobodny tekst.

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

Strony encji mogą również zawierać metadane routingu do użycia przez agentów. Jest to ogólny
frontmatter, więc działa dla osób, zespołów, systemów, projektów lub dowolnego innego
typu encji.

Typowe pola obejmują:

- `entityType`: na przykład `person`, `team`, `system` lub `project`
- `canonicalId`: stabilny klucz tożsamości używany między aliasami i importami
- `aliases`: nazwy, uchwyty lub etykiety, które powinny wskazywać na tę samą stronę
- `privacyTier`: `public`, `local-private`, `sensitive` lub `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: zwarte wskazówki routingu
- `lastRefreshedAt`: znacznik czasu odświeżenia źródła oddzielny od czasu edycji strony
- `personCard`: opcjonalna karta routingu specyficzna dla osoby z uchwytami, profilami społecznościowymi,
  adresami e-mail, strefą czasową, ścieżką, informacjami „pytaj o”, „nie pytaj o”, pewnością i prywatnością
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

Krok kompilacji odczytuje strony wiki, normalizuje podsumowania i emituje stabilne
artefakty przeznaczone dla maszyn pod:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Te streszczenia istnieją po to, aby agenci i kod środowiska wykonawczego nie musieli scrapować stron
Markdown.

Skompilowany wynik zasila również:

- pierwszoprzebiegowe indeksowanie wiki dla przepływów wyszukiwania/pobierania
- wyszukiwanie identyfikatorów twierdzeń z powrotem do stron właścicieli
- zwarte uzupełnienia promptów
- generowanie raportów/paneli kontrolnych

## Panele kontrolne i raporty kondycji

Gdy `render.createDashboards` jest włączone, kompilacja utrzymuje panele kontrolne pod
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
- nieaktualną lub nieznaną świeżość
- strony z nierozwiązanymi pytaniami
- karty routingu osób/encji
- ustrukturyzowane krawędzie relacji
- pokrycie klas dowodów
- niepubliczne poziomy prywatności wymagające przeglądu przed użyciem

## Wyszukiwanie i pobieranie

`memory-wiki` obsługuje dwa backendy wyszukiwania:

- `shared`: użyj współdzielonego przepływu wyszukiwania pamięci, gdy jest dostępny
- `local`: wyszukuj wiki lokalnie

Obsługuje także trzy korpusy:

- `wiki`
- `memory`
- `all`

Ważne zachowanie:

- `wiki_search` i `wiki_get` używają skompilowanych streszczeń jako pierwszego przebiegu, gdy to możliwe
- identyfikatory twierdzeń mogą być rozwiązywane z powrotem do strony właściciela
- kwestionowane/nieaktualne/świeże twierdzenia wpływają na ranking
- etykiety pochodzenia mogą przetrwać do wyników
- tryb wyszukiwania może ukierunkować ranking na wyszukiwanie osób, routing pytań, dowody
  źródłowe lub surowe twierdzenia

Praktyczna zasada:

- używaj `memory_search corpus=all` dla jednego szerokiego przebiegu przywoływania
- używaj `wiki_search` + `wiki_get`, gdy zależy Ci na rankingu specyficznym dla wiki,
  pochodzeniu lub strukturze przekonań na poziomie strony

Tryby wyszukiwania:

- `auto`: zrównoważone ustawienie domyślne
- `find-person`: wzmacnia encje podobne do osób, aliasy, uchwyty, profile społecznościowe i
  identyfikatory kanoniczne
- `route-question`: wzmacnia karty agentów, wskazówki „pytaj o”, wskazówki „najlepiej używać do” i
  kontekst relacji
- `source-evidence`: wzmacnia strony źródłowe i metadane ustrukturyzowanych dowodów
- `raw-claim`: wzmacnia pasujące ustrukturyzowane twierdzenia i zwraca metadane twierdzeń/dowodów
  w wynikach

Gdy wynik pasuje do ustrukturyzowanego twierdzenia, `wiki_search` może zwrócić
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` i `evidenceSourceIds` w swoim ładunku szczegółów. Wynik tekstowy
zawiera również zwarte wiersze `Claim:` i `Evidence:`, gdy są dostępne.

## Narzędzia agentów

Plugin rejestruje te narzędzia:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Co robią:

- `wiki_status`: bieżący tryb skarbca, kondycja, dostępność CLI Obsidian
- `wiki_search`: wyszukuje strony wiki oraz, gdy skonfigurowano, współdzielone korpusy pamięci;
  akceptuje `mode` dla wyszukiwania osób, routingu pytań, dowodów źródłowych lub szczegółowego
  przeglądu surowych twierdzeń
- `wiki_get`: odczytuje stronę wiki według identyfikatora/ścieżki albo wraca do współdzielonego korpusu pamięci
- `wiki_apply`: wąskie mutacje syntezy/metadanych bez swobodnej chirurgii strony
- `wiki_lint`: kontrole strukturalne, braki pochodzenia, sprzeczności, otwarte pytania

Plugin rejestruje też niewyłączny dodatek korpusu pamięci, więc współdzielone
`memory_search` i `memory_get` mogą sięgać do wiki, gdy aktywny Plugin pamięci
obsługuje wybór korpusu.

## Zachowanie promptu i kontekstu

Gdy `context.includeCompiledDigestPrompt` jest włączone, sekcje promptu pamięci
dołączają kompaktową, skompilowaną migawkę z `agent-digest.json`.

Ta migawka jest celowo mała i zawiera tylko najważniejsze sygnały:

- tylko najważniejsze strony
- tylko najważniejsze twierdzenia
- liczba sprzeczności
- liczba pytań
- kwalifikatory pewności/świeżości

Jest to opcjonalne, ponieważ zmienia kształt promptu i jest głównie przydatne dla
silników kontekstu lub starszego składania promptów, które jawnie korzystają z
dodatków pamięci.

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
- `bridge.readMemoryArtifacts`: importuj publiczne artefakty aktywnego Pluginu pamięci
- `bridge.followMemoryEvents`: uwzględnij dzienniki zdarzeń w trybie mostu
- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`
- `context.includeCompiledDigestPrompt`: dołącz kompaktową migawkę digest do sekcji promptu pamięci
- `render.createBacklinks`: generuj deterministyczne bloki powiązane
- `render.createDashboards`: generuj strony paneli

### Przykład: QMD + tryb mostu

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

- QMD jako mechanizm odpowiedzialny za przypominanie aktywnej pamięci
- `memory-wiki` skoncentrowane na skompilowanych stronach i panelach
- niezmieniony kształt promptu, dopóki celowo nie włączysz promptów ze skompilowanym digestem

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

Zobacz [CLI: wiki](/pl/cli/wiki), aby uzyskać pełne odniesienie do poleceń.

## Obsługa Obsidian

Gdy `vault.renderMode` ma wartość `obsidian`, Plugin zapisuje Markdown przyjazny dla
Obsidian i może opcjonalnie używać oficjalnego CLI `obsidian`.

Obsługiwane przepływy pracy obejmują:

- sprawdzanie stanu
- wyszukiwanie w skarbcu
- otwieranie strony
- wywoływanie polecenia Obsidian
- przechodzenie do notatki dziennej

Jest to opcjonalne. Wiki nadal działa w trybie natywnym bez Obsidian.

## Zalecany przepływ pracy

1. Zachowaj aktywny Plugin pamięci do przypominania/promocji/Dreaming.
2. Włącz `memory-wiki`.
3. Zacznij od trybu `isolated`, chyba że jawnie chcesz użyć trybu mostu.
4. Używaj `wiki_search` / `wiki_get`, gdy znaczenie ma pochodzenie.
5. Używaj `wiki_apply` do wąskich syntez lub aktualizacji metadanych.
6. Uruchamiaj `wiki_lint` po istotnych zmianach.
7. Włącz panele, jeśli chcesz widzieć nieaktualne treści i sprzeczności.

## Powiązana dokumentacja

- [Przegląd pamięci](/pl/concepts/memory)
- [CLI: pamięć](/pl/cli/memory)
- [CLI: wiki](/pl/cli/wiki)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
