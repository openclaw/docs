---
read_when:
    - Potrzebujesz trwałej wiedzy wykraczającej poza zwykłe notatki w pliku MEMORY.md
    - Konfigurujesz dołączony Plugin memory-wiki
    - Potrzebujesz oddzielnych magazynów wiki dla agentów w jednym Gatewayu
    - Chcesz zrozumieć działanie wiki_search, wiki_get lub trybu mostu
summary: 'memory-wiki: skompilowany magazyn wiedzy z informacjami o pochodzeniu, twierdzeniami, pulpitami nawigacyjnymi i trybem pomostowym'
title: Wiki pamięci
x-i18n:
    generated_at: "2026-07-12T15:21:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` to wbudowany plugin, który kompiluje trwałą wiedzę w
przeglądalną wiki: deterministyczne strony, ustrukturyzowane twierdzenia z dowodami,
pochodzenie, pulpity oraz skróty w formacie czytelnym maszynowo.

Nie zastępuje on pluginu aktywnej pamięci. Przywoływanie, promowanie, indeksowanie i
Dreaming pozostają w gestii skonfigurowanego backendu pamięci
(`memory-core`, QMD, Honcho itp.). `memory-wiki` działa obok niego i kompiluje
wiedzę w utrzymywaną warstwę wiki.

| Warstwa                | Odpowiada za                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Plugin aktywnej pamięci | Przywoływanie, wyszukiwanie semantyczne, promowanie, Dreaming, środowisko wykonawcze pamięci |
| `memory-wiki`          | Skompilowane strony wiki, syntezy z bogatymi informacjami o pochodzeniu, pulpity, wyszukiwanie/pobieranie/stosowanie wiki |

Praktyczna reguła:

- `memory_search` do jednego szerokiego przebiegu przywoływania we wszystkich skonfigurowanych korpusach
- `wiki_search` / `wiki_get`, gdy potrzebujesz rankingu właściwego dla wiki, informacji o pochodzeniu lub struktury przekonań na poziomie strony
- `memory_search corpus=all`, aby objąć obie warstwy jednym wywołaniem, gdy plugin aktywnej pamięci obsługuje wybór korpusu

Typowa konfiguracja lokalna: QMD jako backend aktywnej pamięci do przywoływania oraz
`memory-wiki` w trybie `bridge` do obsługi trwałych, syntetyzowanych stron. Zobacz
przykład QMD + tryb mostu w sekcji [Konfiguracja](#configuration).

Jeśli tryb mostu zgłasza zero wyeksportowanych artefaktów, plugin aktywnej pamięci
nie udostępnia obecnie publicznych danych wejściowych mostu. Najpierw uruchom `openclaw wiki doctor`,
a następnie potwierdź, że plugin aktywnej pamięci obsługuje publiczne artefakty.

## Tryby magazynu

- `isolated` (domyślny): własny magazyn, własne źródła, bez zależności od pluginu aktywnej pamięci. Użyj go do samodzielnego, starannie zarządzanego repozytorium wiedzy.
- `bridge`: odczytuje publiczne artefakty pamięci i dzienniki zdarzeń z pluginu aktywnej pamięci przez publiczne mechanizmy SDK pluginów. Użyj go do kompilowania artefaktów eksportowanych przez plugin pamięci bez sięgania do jego prywatnych elementów wewnętrznych.
- `unsafe-local`: jawne obejście przeznaczone dla prywatnych ścieżek lokalnych na tej samej maszynie. Celowo eksperymentalne i nieprzenośne; używaj go tylko wtedy, gdy rozumiesz granicę zaufania i potrzebujesz dostępu do lokalnego systemu plików, którego tryb mostu nie może zapewnić.

Tryb magazynu i zakres magazynu to odrębne ustawienia:

- `vaultMode` określa, skąd pochodzą dane wejściowe wiki.
- `vault.scope` określa, czy wszyscy agenci korzystają z jednego magazynu, czy każdy agent otrzymuje magazyn podrzędny.

`vault.scope: "global"` jest ustawieniem domyślnym i zachowuje dotychczasowe
działanie jednego magazynu. Użyj `vault.scope: "agent"` z trybem `isolated` lub `bridge`, gdy
agenci nie mogą współdzielić stron wiki, skompilowanych skrótów, wyników wyszukiwania ani zapisów.
Zakresu agenta nie można łączyć z trybem `unsafe-local`, ponieważ skonfigurowane
prywatne ścieżki nie są danymi wejściowymi należącymi do agenta. Walidacja konfiguracji odrzuca
taką kombinację.

Tryb mostu może indeksować zgodnie z przełącznikami konfiguracji `bridge.*`:

- wyeksportowane artefakty pamięci (`indexMemoryRoot`)
- notatki dzienne (`indexDailyNotes`)
- raporty Dreaming (`indexDreamReports`)
- dzienniki zdarzeń pamięci (`followMemoryEvents`)

Gdy tryb mostu jest aktywny i włączono `bridge.readMemoryArtifacts`,
polecenia `openclaw wiki status`, `openclaw wiki doctor` oraz `openclaw wiki bridge
import` są kierowane przez działający Gateway, dzięki czemu widzą ten sam kontekst aktywnego pluginu
pamięci co pamięć agenta/środowiska wykonawczego. Jeśli most jest wyłączony lub odczyt
artefaktów jest wyłączony, polecenia te zachowują działanie lokalne/offline.

## Układ magazynu

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

Zarządzana zawartość pozostaje wewnątrz generowanych bloków; bloki notatek użytkownika są
zachowywane podczas ponownego generowania.

- `sources/`: zaimportowane materiały źródłowe oraz strony oparte na trybie bridge/unsafe-local
- `entities/`: trwałe elementy, osoby, systemy, projekty, obiekty
- `concepts/`: idee, abstrakcje, wzorce, zasady (również miejsce docelowe importów OKF)
- `syntheses/`: skompilowane podsumowania i utrzymywane zestawienia
- `reports/`: generowane pulpity

## Importy Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importuje rozpakowany pakiet Open Knowledge Format do stron pojęć wiki. Jest to dobre
rozwiązanie, gdy katalog danych, robot indeksujący dokumentację lub agent wzbogacający dane już
generuje OKF: zachowaj OKF jako przenośny artefakt wymiany, a `memory-wiki`
przekształci go w natywne dla OpenClaw strony pojęć i skompilowane skróty.

- niezastrzeżone pliki `.md` są dokumentami pojęć
- każde importowane pojęcie wymaga niepustego pola frontmatter `type`; brak `type` powoduje ostrzeżenie `missing-type`, a plik jest pomijany
- nieznane wartości `type` są akceptowane jako ogólne pojęcia
- `index.md` i `log.md` są zastrzeżone i nigdy nie są importowane jako pojęcia
- uszkodzone lub zewnętrzne łącza Markdown pozostają bez zmian

Zaimportowane strony są umieszczane bezpośrednio w `concepts/`, dzięki czemu istniejące procesy
kompilowania, wyszukiwania, pobierania i generowania pulpitów widzą je bez tworzenia drugiego drzewa wiki. Każda strona zachowuje
oryginalny identyfikator pojęcia OKF, ścieżkę źródłową, `type`, `resource`, `tags`, znacznik czasu
oraz pełny frontmatter producenta. Wewnętrzne łącza OKF są przepisywane tak, aby wskazywały wygenerowane
strony pojęć wiki, a także tworzą ustrukturyzowane wpisy `relationships` z
`kind: okf-link`.

## Ustrukturyzowane twierdzenia i dowody

Strony zawierają ustrukturyzowany frontmatter `claims`, a nie tylko tekst swobodny. Każde
twierdzenie może zawierać `id`, `text`, `status`, `confidence`, `evidence[]` oraz
`updatedAt`. Każdy wpis dowodu może zawierać `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` oraz `updatedAt`.

Dzięki temu wiki działa jak warstwa przekonań, a nie bierny zbiór notatek.
Twierdzenia można śledzić, oceniać, kwestionować i rozstrzygać na podstawie źródeł.

## Metadane encji przeznaczone dla agentów

Strony encji zawierają ogólne metadane routingu, których można używać dla osób, zespołów,
systemów, projektów lub dowolnych innych typów encji:

- `entityType`: na przykład `person`, `team`, `system`, `project`
- `canonicalId`: stabilny klucz tożsamości używany w aliasach i importach
- `aliases`: nazwy, identyfikatory lub etykiety wskazujące tę samą stronę
- `privacyTier`: ciąg znaków o dowolnej postaci; `public` jest traktowane jako niewymagające przeglądu, a każda inna wartość (na przykład `local-private`, `sensitive`, `confirm-before-use`) jest oznaczana w `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: zwięzłe wskazówki dotyczące routingu
- `lastRefreshedAt`: znacznik czasu odświeżenia źródła, niezależny od czasu edycji strony
- `personCard`: opcjonalna karta routingu właściwa dla osoby (identyfikatory, profile społecznościowe, adresy e-mail, strefa czasowa, obszar, sprawy, o które warto pytać, sprawy, o które nie należy pytać, poziom pewności, poziom prywatności)
- `relationships`: typowane krawędzie prowadzące do powiązanych stron (cel, rodzaj, waga, poziom pewności, rodzaj dowodu, poziom prywatności, uwaga)

W przypadku wiki osób zacznij od `reports/person-agent-directory.md`, a następnie otwórz
stronę osoby za pomocą `wiki_get`, zanim użyjesz danych kontaktowych lub wywnioskowanych
faktów.

<Accordion title="Przykład strony encji">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Przekierowywanie w przykładowym ekosystemie
notEnoughFor:
  - zatwierdzanie prawne
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Przykładowy ekosystem
  askFor:
    - Pytania dotyczące przykładowego wdrożenia
  avoidAskingFor:
    - niepowiązane decyzje rozliczeniowe
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Inna osoba
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex jest pomocny przy przekierowywaniu w przykładowym ekosystemie.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Proces kompilowania

Kompilowanie odczytuje strony wiki, normalizuje podsumowania i generuje stabilne
artefakty przeznaczone dla maszyn w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Agenci i kod środowiska wykonawczego odczytują te skróty zamiast analizować Markdown.
Skompilowane dane wyjściowe zasilają również pierwszy etap indeksowania wiki na potrzeby wyszukiwania/pobierania, wyszukiwanie
twierdzeń według identyfikatora i wskazywanie stron, do których należą, zwięzłe uzupełnienia promptów oraz generowanie
raportów.

## Pulpity i raporty o stanie

Gdy włączono `render.createDashboards`, kompilowanie utrzymuje pulpity w
`reports/`:

| Raport                              | Śledzi                                             |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | strony z nierozstrzygniętymi pytaniami             |
| `reports/contradictions.md`         | klastry uwag o sprzecznościach                     |
| `reports/low-confidence.md`         | strony i twierdzenia o niskim poziomie pewności    |
| `reports/claim-health.md`           | twierdzenia bez ustrukturyzowanych dowodów         |
| `reports/stale-pages.md`            | nieaktualną lub nieznaną świeżość                  |
| `reports/person-agent-directory.md` | karty routingu osób/encji                          |
| `reports/relationship-graph.md`     | ustrukturyzowane krawędzie relacji                 |
| `reports/provenance-coverage.md`    | pokrycie klas dowodów                              |
| `reports/privacy-review.md`         | niepubliczne poziomy prywatności wymagające przeglądu przed użyciem |

## Wyszukiwanie i pobieranie

Dwa backendy wyszukiwania:

- `shared`: używa współdzielonego procesu wyszukiwania w pamięci, gdy jest dostępny
- `local`: przeszukuje wiki lokalnie

Trzy korpusy: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` używają skompilowanych skrótów jako pierwszego etapu, gdy jest to możliwe
- identyfikatory twierdzeń wskazują stronę, do której należą
- kwestionowane/nieaktualne/świeże twierdzenia wpływają na ranking
- etykiety pochodzenia są zachowywane w wynikach

Tryby wyszukiwania (parametr `--mode` / parametr narzędzia `mode`):

| Tryb              | Wzmacnia                                                         |
| ----------------- | ---------------------------------------------------------------- |
| `auto`            | zrównoważone ustawienie domyślne                                 |
| `find-person`     | encje przypominające osoby, aliasy, identyfikatory, profile społecznościowe, identyfikatory kanoniczne |
| `route-question`  | karty agentów, wskazówki spraw, o które warto pytać/najlepszych zastosowań, kontekst relacji |
| `source-evidence` | strony źródłowe i metadane ustrukturyzowanych dowodów            |
| `raw-claim`       | pasujące ustrukturyzowane twierdzenia; zwraca metadane twierdzeń/dowodów |

Gdy wynik pasuje do ustrukturyzowanego twierdzenia, `wiki_search` zwraca
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` oraz `evidenceSourceIds` w szczegółowym ładunku. Tekstowe dane wyjściowe
zawierają zwięzłe wiersze `Claim:` i `Evidence:`, gdy są dostępne.

## Narzędzia agentów

| Narzędzie     | Przeznaczenie                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wiki_status` | bieżący tryb i zakres magazynu, rozpoznany agent, stan działania, dostępność CLI Obsidian                                                                                            |
| `wiki_search` | przeszukuje strony wiki oraz, po skonfigurowaniu, korpus współdzielonej pamięci; przyjmuje `mode` do wyszukiwania osób, kierowania pytań, uzyskiwania dowodów źródłowych lub analizy surowych twierdzeń |
| `wiki_get`    | odczytuje stronę wiki według identyfikatora lub ścieżki, a gdy wyszukiwanie współdzielone jest włączone i nie znajdzie wyniku, korzysta z korpusu współdzielonej pamięci              |
| `wiki_apply`  | wykonuje ograniczone zmiany syntezy lub metadanych bez swobodnej ingerencji w stronę                                                                                                |
| `wiki_lint`   | przeprowadza kontrole strukturalne oraz wykrywa luki w pochodzeniu informacji, sprzeczności i otwarte pytania                                                                        |

Wtyczka rejestruje również niewyłączny dodatkowy korpus pamięci, dzięki czemu
współdzielone `memory_search` i `memory_get` mogą uzyskiwać dostęp do wiki, gdy
aktywna wtyczka pamięci obsługuje wybór korpusu.

## Zachowanie promptu i kontekstu

Gdy opcja `context.includeCompiledDigestPrompt` jest włączona, sekcje pamięci
w prompcie są uzupełniane o zwięzły, skompilowany obraz z pliku
`agent-digest.json`: tylko najważniejsze strony, tylko najważniejsze twierdzenia,
liczbę sprzeczności, liczbę pytań oraz kwalifikatory pewności i aktualności.
Jest to funkcja opcjonalna, ponieważ zmienia strukturę promptu; ma znaczenie
głównie dla silników kontekstu lub mechanizmów składania promptów, które jawnie
wykorzystują uzupełnienia pamięci.

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
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

Najważniejsze przełączniki:

| Klucz                                      | Wartości / wartość domyślna                    | Uwagi                                                                                          |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (domyślnie), `bridge`, `unsafe-local` | wybiera sposób obsługi danych wejściowych i integracji                                          |
| `vault.scope`                              | `global` (domyślnie), `agent`                  | jeden współdzielony magazyn lub osobny magazyn podrzędny dla każdego agenta                     |
| `vault.path`                               | globalna wartość domyślna `~/.openclaw/wiki/main` | dokładna ścieżka magazynu w zakresie globalnym; katalog nadrzędny w zakresie agenta ma domyślną wartość `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (domyślnie), `obsidian`               |                                                                                                |
| `bridge.readMemoryArtifacts`               | domyślnie `true`                               | importuje publiczne artefakty aktywnej wtyczki pamięci                                         |
| `bridge.followMemoryEvents`                | domyślnie `true`                               | uwzględnia dzienniki zdarzeń w trybie pomostowym                                               |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | domyślnie `false`                              | wymagane do wykonywania importów `unsafe-local`                                                |
| `unsafeLocal.paths`                        | domyślnie `[]`                                 | jawne ścieżki lokalne do zaimportowania w trybie `unsafe-local`                                |
| `search.backend`                           | `shared` (domyślnie), `local`                  |                                                                                                |
| `search.corpus`                            | `wiki` (domyślnie), `memory`, `all`            |                                                                                                |
| `context.includeCompiledDigestPrompt`      | domyślnie `false`                              | dołącza zwięzły obraz skrótu wybranego agenta do sekcji pamięci w prompcie                     |
| `render.createBacklinks`                   | domyślnie `true`                               | generuje deterministyczne bloki powiązanych treści                                             |
| `render.createDashboards`                  | domyślnie `true`                               | generuje strony pulpitów                                                                       |

### Magazyny poszczególnych agentów

Ustaw `vault.scope` na `agent`, aby każdy skonfigurowany agent miał osobną wiki.
W tym zakresie `vault.path` jest katalogiem nadrzędnym, a OpenClaw dołącza
znormalizowany identyfikator agenta:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Wynikowe ścieżki to `~/.openclaw/wiki/support` oraz
`~/.openclaw/wiki/marketing`. Jeśli `vault.path` zostanie pominięte w zakresie
agenta, domyślnym katalogiem nadrzędnym jest `~/.openclaw/wiki`. Domyślny agent
`main` zachowuje więc istniejącą ścieżkę `~/.openclaw/wiki/main`.

Narzędzia agenta, skompilowane skróty promptu oraz uzupełnienie wiki udostępniane
przez `memory_search` / `memory_get` wybierają magazyn na podstawie kontekstu
aktywnego agenta. W przypadku wywołań CLI i Gateway w konfiguracji z wieloma
agentami jawnie podaj agenta za pomocą `openclaw wiki --agent <agentId> ...`
lub pola `agentId` w żądaniu Gateway. Jeśli skonfigurowano tylko jednego agenta,
pozostaje on domyślny, gdy nie podano identyfikatora.

W trybie pomostowym importy w zakresie agenta przyjmują publiczny artefakt
pamięci tylko wtedy, gdy jego `agentIds` zawiera wybranego agenta. Artefakty
należące do innego agenta, pozbawione metadanych właściciela lub mające
nieznanego właściciela są pomijane. Zakres globalny zachowuje dotychczasowe
zachowanie współdzielonych artefaktów.

<Warning>
Zmiana `vault.scope` nie kopiuje ani nie dzieli istniejącego magazynu. W zakresie
agenta jawnie skonfigurowane `vault.path` staje się katalogiem nadrzędnym, dlatego
przed przełączeniem agentów produkcyjnych należy świadomie przenieść lub
zaimportować istniejące strony. Najpierw wykonaj kopię zapasową magazynu.

Magazyny poszczególnych agentów stanowią granicę wiedzy w obrębie tego samego
procesu, a nie granicę bezpieczeństwa systemu operacyjnego. Wtyczki i narzędzia
działające bez piaskownicy, które mają dostęp do systemu plików hosta, nadal
mogą odczytać katalog innego agenta. Gdy agenci nie ufają sobie nawzajem, użyj
[piaskownicy](/pl/gateway/sandboxing) lub
[oddzielnych profili Gateway](/pl/gateway/multiple-gateways).
</Warning>

### Przykład: QMD i tryb pomostowy

Użyj tej konfiguracji, jeśli chcesz stosować QMD do przywoływania informacji,
a `memory-wiki` jako utrzymywaną warstwę wiedzy. Każda warstwa zachowuje własny
zakres odpowiedzialności: QMD umożliwia przeszukiwanie surowych notatek,
eksportów sesji i dodatkowych kolekcji, natomiast `memory-wiki` kompiluje
stabilne encje, twierdzenia, pulpity i strony źródłowe.

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

Dzięki temu QMD odpowiada za przywoływanie informacji z aktywnej pamięci,
`memory-wiki` koncentruje się na skompilowanych stronach i pulpitach, a struktura
promptu pozostaje niezmieniona, dopóki świadomie nie włączysz skompilowanych
skrótów w promptach.

## CLI

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

Pełny opis poleceń, w tym `wiki okf import`, `wiki apply metadata`,
`wiki unsafe-local import`, `wiki chatgpt import` / `wiki chatgpt rollback`
oraz pełny zestaw podpoleceń `wiki obsidian`, znajdziesz w sekcji
[CLI: wiki](/pl/cli/wiki).

## Obsługa Obsidian

Gdy `vault.renderMode` ma wartość `obsidian`, wtyczka zapisuje Markdown
przystosowany do Obsidian i może opcjonalnie używać oficjalnego CLI `obsidian`
do sprawdzania stanu, przeszukiwania magazynu, otwierania strony, wywoływania
polecenia oraz przechodzenia do notatki dziennej. Jest to opcjonalne; wiki nadal
działa w trybie natywnym bez Obsidian.

Magazyny w zakresie agenta również mogą używać formatu Markdown przystosowanego
do Obsidian, ale walidacja konfiguracji odrzuca połączenie
`obsidian.useOfficialCli: true` z `vault.scope: "agent"`. Bieżące ustawienie
`obsidian.vaultName` jest globalne i nie może wybierać osobnego magazynu
Obsidian dla każdego agenta. Zamiast tego używaj narzędzi wiki i operacji CLI
albo pozostaw wiki obsługiwaną przez Obsidian w zakresie globalnym.

## Zalecany przepływ pracy

<Steps>
<Step title="Zachowaj aktywną wtyczkę pamięci do przywoływania informacji">
Przywoływanie, promowanie i Dreaming pozostają odpowiedzialnością skonfigurowanego mechanizmu pamięci.
</Step>
<Step title="Włącz memory-wiki">
Zacznij od trybu `isolated`, chyba że świadomie chcesz używać trybu pomostowego.
</Step>
<Step title="Gdy ważne jest pochodzenie informacji, używaj wiki_search / wiki_get">
Preferuj je zamiast `memory_search`, jeśli potrzebujesz rankingu właściwego dla wiki lub struktury przekonań na poziomie strony.
</Step>
<Step title="Używaj wiki_apply do ograniczonych syntez lub aktualizacji metadanych">
Unikaj ręcznego edytowania zarządzanych, generowanych bloków.
</Step>
<Step title="Po istotnych zmianach uruchamiaj wiki_lint">
Wykrywa sprzeczności, otwarte pytania i luki w pochodzeniu informacji.
</Step>
<Step title="Włącz pulpity, aby uwidocznić nieaktualne informacje i sprzeczności">
Ustaw `render.createDashboards: true` (wartość domyślna).
</Step>
</Steps>

## Powiązana dokumentacja

- [Omówienie pamięci](/pl/concepts/memory)
- [CLI: pamięć](/pl/cli/memory)
- [CLI: wiki](/pl/cli/wiki)
- [Omówienie SDK wtyczek](/pl/plugins/sdk-overview)
