---
read_when:
    - Chcesz używać CLI memory-wiki
    - Dokumentujesz lub zmieniasz `openclaw wiki`
summary: Dokumentacja CLI dla `openclaw wiki` (stan skarbca memory-wiki, wyszukiwanie, kompilowanie, lintowanie, stosowanie, most, import z ChatGPT i narzędzia pomocnicze Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T15:02:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Przeglądaj i utrzymuj skarbiec `memory-wiki`. Funkcję zapewnia dołączony plugin `memory-wiki`.

Powiązane: [Plugin Memory Wiki](/pl/plugins/memory-wiki), [Omówienie pamięci](/pl/concepts/memory), [CLI: pamięć](/pl/cli/memory)

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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Wybór agenta

Gdy `plugins.entries.memory-wiki.config.vault.scope` ma wartość `agent`, wybierz
skarbiec za pomocą opcji najwyższego poziomu `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

W konfiguracji z wieloma agentami opcja `--agent` jest wymagana w operacjach
CLI, aby polecenie nie mogło odczytać ani zapisać dowolnego domyślnego skarbca.
Jeśli skonfigurowano tylko jednego agenta, pozostaje on agentem domyślnym.
Nieznane identyfikatory agentów powodują błąd przed rozpoczęciem operacji na
skarbcu. Opcja nie zmienia wybranej ścieżki, gdy `vault.scope` ma wartość
`global`.

Klienci Gateway stosują tę samą regułę: w konfiguracji wieloagentowej ze
skarbcem przypisanym do agenta przekazuj `agentId` w żądaniach `wiki.*`
korzystających ze skarbca. Brakujący lub nieznany identyfikator jest błędem.
Tury agenta, narzędzia wiki, uzupełnienia korpusu pamięci i skompilowane skróty
promptów już zawierają kontekst aktywnego agenta środowiska wykonawczego.

## Polecenia

### `wiki status`

Wyświetla tryb i zakres skarbca, rozpoznanego agenta, stan oraz dostępność CLI Obsidian. Użyj tego polecenia w pierwszej kolejności, aby sprawdzić, czy właściwy skarbiec został zainicjowany, tryb mostu działa prawidłowo lub integracja z Obsidian jest dostępna.

Gdy tryb mostu jest aktywny i skonfigurowany do odczytu artefaktów pamięci, polecenie wysyła zapytanie do działającego Gateway, dzięki czemu widzi ten sam kontekst aktywnego pluginu pamięci co pamięć agenta lub środowiska wykonawczego.

### `wiki doctor`

Uruchamia kontrole stanu wiki i zgłasza możliwe do wykonania poprawki. Kończy działanie z niezerowym kodem, gdy wykryje problemy.

Gdy tryb mostu jest aktywny i skonfigurowany do odczytu artefaktów pamięci, polecenie wysyła zapytanie do działającego Gateway przed utworzeniem raportu. Wyłączone importy mostu i konfiguracje mostu, które nie odczytują artefaktów pamięci, pozostają lokalne i działają bez połączenia.

Typowe problemy:

- tryb mostu włączony bez publicznych artefaktów pamięci
- nieprawidłowy lub brakujący układ skarbca
- brak zewnętrznego CLI Obsidian, gdy oczekiwany jest tryb Obsidian

### `wiki init`

Tworzy układ skarbca wiki i strony początkowe, w tym indeksy najwyższego poziomu i katalogi pamięci podręcznej.

### `wiki ingest <path>`

Importuje lokalny plik Markdown lub tekstowy do folderu `sources/` wiki jako stronę źródłową. `<path>` musi być ścieżką do pliku lokalnego; obecnie import z adresu URL nie jest dostępny. Odrzuca pliki binarne.

Zaimportowane strony źródłowe zawierają metadane pochodzenia we frontmatter (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Po imporcie skarbiec jest zawsze ponownie kompilowany.

Flagi: `--title <title>` zastępuje tytuł źródła (domyślnie jest on wyprowadzany z nazwy pliku).

### `wiki okf import <path>`

Importuje rozpakowany pakiet Open Knowledge Format do stron pojęć wiki.

Importer odczytuje każdy niezastrzeżony dokument pojęcia `.md` w drzewie katalogów OKF, wymaga niepustego pola `type`, a nieznane wartości `type` OKF traktuje jako ogólne pojęcia. Zastrzeżone pliki OKF `index.md` i `log.md` nie są importowane jako pojęcia.

Zaimportowane strony są umieszczane bezpośrednio w `concepts/`, dzięki czemu istniejące procesy kompilowania, wyszukiwania, pobierania, tworzenia skrótów i pulpitów wiki natychmiast je uwzględniają. Oryginalny identyfikator pojęcia OKF, `type`, `resource`, `tags`, znacznik czasu, ścieżka źródłowa i pełne frontmatter zostają zachowane we frontmatter strony. Wewnętrzne odnośniki Markdown OKF są przepisywane tak, aby wskazywały wygenerowane strony wiki; uszkodzone lub zewnętrzne odnośniki pozostają bez zmian. Po imporcie skarbiec jest zawsze ponownie kompilowany.

Przykłady:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Przebudowuje indeksy, bloki powiązań, pulpity i skompilowane skróty. Zapisuje stabilne artefakty przeznaczone do odczytu maszynowego w:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jeśli opcja `render.createDashboards` jest włączona, kompilacja odświeża również strony raportów.

### `wiki lint`

Sprawdza skarbiec i zapisuje raport obejmujący:

- problemy strukturalne (uszkodzone odnośniki, brakujące lub zduplikowane identyfikatory, brak typu lub tytułu strony, nieprawidłowe frontmatter)
- braki w informacjach o pochodzeniu (brakujące identyfikatory źródeł, brakujące informacje o pochodzeniu importu)
- sprzeczności (oznaczone sprzeczności, kolidujące twierdzenia)
- otwarte pytania
- strony i twierdzenia o niskim poziomie pewności
- nieaktualne strony i twierdzenia

Uruchom to polecenie po istotnych aktualizacjach wiki.

### `wiki search <query>`

Przeszukuje zawartość wiki. Zachowanie zależy od konfiguracji:

- `search.backend`: `shared` lub `local`
- `search.corpus`: `wiki`, `memory` lub `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` lub `raw-claim`

Użyj `wiki search`, gdy istotne są ranking właściwy dla wiki i informacje o pochodzeniu. Aby wykonać jedno szerokie wyszukiwanie we współdzielonych zasobach pamięci, wybierz `openclaw memory search`, jeśli aktywny plugin pamięci udostępnia wyszukiwanie współdzielone.

Tryby wyszukiwania:

- `find-person`: aliasy, nazwy użytkowników, profile społecznościowe, kanoniczne identyfikatory i strony osób
- `route-question`: wskazówki dotyczące tego, kogo zapytać i do czego najlepiej wykorzystać daną osobę, oraz kontekst relacji
- `source-evidence`: strony źródłowe i ustrukturyzowane pola dowodów
- `raw-claim`: ustrukturyzowany tekst twierdzenia z metadanymi twierdzenia i dowodów

Przykłady:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Dane wyjściowe w formacie tekstowym zawierają wiersze `Claim:` i `Evidence:`, gdy wynik pasuje do ustrukturyzowanego twierdzenia. Dane wyjściowe JSON dodatkowo udostępniają pola `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` i `evidenceSourceIds`, umożliwiające agentowi szczegółową analizę.

### `wiki get <lookup>`

Odczytuje stronę wiki według identyfikatora lub ścieżki względnej.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Stosuje ściśle określone zmiany bez swobodnego modyfikowania stron:

- `apply synthesis <title>`: tworzy lub odświeża stronę syntezy z zarządzaną treścią podsumowania
- `apply metadata <lookup>`: aktualizuje metadane istniejącej strony

Oba polecenia akceptują `--source-id`, `--contradiction`, `--question` (każde może być powtarzane), `--confidence <n>` (0–1) i `--status <status>`. `apply metadata` akceptuje również `--clear-confidence`, aby usunąć zapisaną wartość poziomu pewności. Jest to obsługiwany sposób rozwijania stron wiki, który zachowuje integralność zarządzanych, wygenerowanych bloków.

### `wiki bridge import`

Importuje publiczne artefakty pamięci z aktywnego pluginu pamięci do stron źródłowych opartych na moście. Użyj tego polecenia w trybie `bridge`, aby pobrać najnowsze wyeksportowane artefakty pamięci do skarbca wiki.

W przypadku aktywnego odczytu artefaktów mostu CLI przekierowuje import przez RPC Gateway, aby użyć kontekstu pluginu pamięci środowiska wykonawczego. Jeśli importy mostu są wyłączone lub odczyt artefaktów jest wyłączony, polecenie zachowuje lokalne zachowanie bez połączenia, które nie importuje żadnych elementów. Odświeżanie indeksu po imporcie jest kontrolowane przez `ingest.autoCompile`.

### `wiki unsafe-local import`

Importuje dane z jawnie skonfigurowanych ścieżek lokalnych (`unsafeLocal.paths`) w trybie `unsafe-local`. Funkcja jest celowo eksperymentalna i przeznaczona wyłącznie do użycia na tej samej maszynie. Odświeżanie indeksu po imporcie jest kontrolowane przez `ingest.autoCompile`.

### `wiki chatgpt import`

Importuje eksport ChatGPT do roboczych stron źródłowych wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Flaga             | Wartość domyślna | Opis                                                                |
| ----------------- | ---------------- | ------------------------------------------------------------------- |
| `--export <path>` | (wymagana)       | Katalog eksportu ChatGPT lub ścieżka do pliku `conversations.json`. |
| `--dry-run`       | `false`          | Wyświetla liczbę utworzonych, zaktualizowanych i pominiętych stron bez ich zapisywania. |

Import bez opcji `--dry-run`, który zmienia dowolną stronę, zapisuje identyfikator przebiegu importu, wyświetlany w podsumowaniu i wymagany do wycofania zmian.

### `wiki chatgpt rollback <run-id>`

Wycofuje wcześniej zastosowany przebieg importu ChatGPT, usuwając utworzone przez niego strony i przywracając strony, które nadpisał. Nie wykonuje żadnych działań (i zgłasza `alreadyRolledBack`), jeśli przebieg został już wycofany.

### `wiki obsidian ...`

Polecenia pomocnicze Obsidian dla skarbców działających w trybie zgodnym z Obsidian: `status`, `search`, `open`, `command`, `daily`. Gdy opcja `obsidian.useOfficialCli` jest włączona, wymagają oficjalnego CLI `obsidian` dostępnego w `PATH`.

Walidacja konfiguracji odrzuca `obsidian.useOfficialCli: true`, gdy
`vault.scope` ma wartość `agent`, ponieważ `obsidian.vaultName` jest jednym
ustawieniem globalnym, a nie mapowaniem dla poszczególnych agentów.
Renderowanie Markdown zgodne z Obsidian pozostaje dostępne.

## Praktyczne wskazówki dotyczące użycia

- Używaj `wiki search` i `wiki get`, gdy istotne są pochodzenie i tożsamość strony.
- Używaj `wiki apply` zamiast ręcznie edytować zarządzane, wygenerowane sekcje.
- Używaj `wiki lint`, zanim zaufasz sprzecznej zawartości lub zawartości o niskim poziomie pewności.
- Używaj `wiki compile` po imporcie zbiorczym lub zmianach źródeł, gdy potrzebujesz natychmiast odświeżonych pulpitów i skompilowanych skrótów.
- Używaj `wiki okf import`, gdy katalog danych, eksport dokumentacji lub potok wzbogacania agenta już generuje pakiety Markdown OKF.
- Używaj `wiki bridge import`, gdy tryb mostu zależy od nowo wyeksportowanych artefaktów pamięci.

## Powiązania z konfiguracją

Na zachowanie `openclaw wiki` wpływają:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Pełny model konfiguracji znajdziesz w sekcji [Plugin Memory Wiki](/pl/plugins/memory-wiki).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wiki pamięci](/pl/plugins/memory-wiki)
