---
read_when:
    - Chcesz odczytać lub zapisać liść w pliku obszaru roboczego z terminala
    - Tworzysz skrypty korzystające ze stanu przestrzeni roboczej i chcesz stabilnego, niezależnego od rodzaju schematu adresowania
    - Debugujesz ścieżkę `oc://` (sprawdź składnię, zobacz, do czego się rozwiązuje)
summary: Dokumentacja CLI dla `openclaw path` (inspekcja i edycja plików obszaru roboczego za pomocą schematu adresowania `oc://`)
title: Ścieżka
x-i18n:
    generated_at: "2026-06-27T17:22:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Dostęp powłoki dostarczany przez Plugin do podłoża adresowania `oc://`: jeden schemat ścieżek rozdzielany według rodzaju do inspekcji i edycji adresowalnych plików obszaru roboczego (markdown, jsonc, jsonl, yaml/yml/lobster). Osoby self-hostujące, autorzy Pluginów i rozszerzenia edytorów używają go do odczytu, wyszukiwania lub aktualizowania wąskiej lokalizacji bez ręcznego tworzenia parserów dla każdego typu pliku.

CLI odzwierciedla publiczne czasowniki podłoża:

- `resolve` jest konkretny i zwraca pojedyncze dopasowanie.
- `find` jest czasownikiem wielu dopasowań dla symboli wieloznacznych, unii, predykatów i rozwijania pozycyjnego.
- `set` akceptuje tylko konkretne ścieżki lub znaczniki wstawiania; wzorce wieloznaczne są odrzucane przed zapisem.

`path` jest dostarczany przez dołączony opcjonalny Plugin `oc-path`. Włącz go przed pierwszym użyciem:

```bash
openclaw plugins enable oc-path
```

## Dlaczego warto go używać

Stan OpenClaw jest rozproszony między edytowanym przez ludzi markdownem, komentowaną konfiguracją JSONC, dopisywanymi tylko na końcu logami JSONL oraz plikami przepływów pracy/specyfikacji YAML. Skrypty powłoki, hooki i agenci często potrzebują jednej małej wartości z tych plików: klucza frontmatter, ustawienia Pluginu, pola rekordu logu, kroku YAML albo elementu listy pod nazwaną sekcją.

`openclaw path` daje takim wywołującym stabilny adres zamiast jednorazowego grepa, regexu lub parsera dla każdego rodzaju pliku. Tę samą ścieżkę `oc://` można zweryfikować, rozwiązać, przeszukać, uruchomić próbnie i zapisać z terminala, dzięki czemu wąska automatyzacja jest łatwiejsza do przeglądu i bezpieczniejsza do ponownego wykonania. Jest to szczególnie przydatne, gdy chcesz zaktualizować jeden liść, zachowując resztę komentarzy pliku, zakończenia linii i otaczające formatowanie.

Użyj go, gdy potrzebna rzecz ma logiczny adres, ale fizyczny kształt pliku się różni:

- Hook chce odczytać jedno ustawienie z komentowanego JSONC bez utraty komentarzy przy zapisie wartości z powrotem.
- Skrypt konserwacyjny chce znaleźć każde pasujące pole zdarzenia w logu JSONL bez ładowania całego logu do niestandardowego parsera.
- Rozszerzenie edytora chce przeskoczyć do sekcji markdown lub elementu listy według sluga, a następnie wyrenderować dokładną linię, do której ścieżka została rozwiązana.
- Agent chce próbnie uruchomić drobną edycję obszaru roboczego przed jej zastosowaniem, z bajtami zmian widocznymi w przeglądzie.

Prawdopodobnie nie potrzebujesz `openclaw path` do zwykłych edycji całych plików, bogatych migracji konfiguracji ani zapisów specyficznych dla pamięci. Powinny one używać polecenia lub Pluginu właściciela. `path` służy do małych, adresowalnych operacji na plikach, gdzie powtarzalne polecenie terminala jest czytelniejsze niż kolejny dedykowany parser.

## Jak jest używany

Odczytaj jedną wartość z pliku konfiguracji edytowanego przez ludzi:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Podejrzyj zapis bez dotykania dysku:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Znajdź pasujące rekordy w logu JSONL dopisywanym tylko na końcu:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Zaadresuj instrukcję w markdownie według sekcji i elementu zamiast numeru linii:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Zweryfikuj ścieżkę w CI lub skrypcie preflight, zanim skrypt zacznie czytać albo pisać:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Te polecenia mają nadawać się do kopiowania do skryptów powłoki. Użyj `--json`, gdy wywołujący potrzebuje ustrukturyzowanego wyjścia, oraz `--human`, gdy wynik ogląda człowiek.

## Jak to działa

`openclaw path` robi cztery rzeczy:

1. Parsuje adres `oc://` na sloty: plik, sekcja, element, pole i opcjonalna sesja.
2. Wybiera adapter rodzaju pliku na podstawie rozszerzenia celu (`.md`, `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` oraz powiązanych aliasów).
3. Rozwiązuje sloty względem AST tego rodzaju pliku: nagłówków/elementów markdown, kluczy obiektów/indeksów tablic JSONC, rekordów linii JSONL albo węzłów map/sekwencji YAML.
4. Dla `set` emituje zmienione bajty przez ten sam adapter, dzięki czemu nietknięte części pliku zachowują swoje komentarze, zakończenia linii i pobliskie formatowanie tam, gdzie dany rodzaj to obsługuje.

`resolve` i `set` wymagają jednego konkretnego celu. `find` jest czasownikiem eksploracyjnym: rozwija symbole wieloznaczne, unie, predykaty i liczebniki porządkowe do konkretnych dopasowań, które możesz sprawdzić przed wybraniem jednego do zapisu.

## Podpolecenia

| Podpolecenie            | Cel                                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Wypisz konkretne dopasowanie pod ścieżką (albo „nie znaleziono”).             |
| `find <pattern>`        | Wylicz dopasowania dla ścieżki z symbolem wieloznacznym / unią / predykatem. |
| `set <oc-path> <value>` | Zapisz liść lub cel wstawiania pod konkretną ścieżką. Obsługuje `--dry-run`.  |
| `validate <oc-path>`    | Tylko parsowanie; wypisz rozbicie strukturalne (plik / sekcja / element / pole). |
| `emit <file>`           | Przepuść plik w obie strony przez `parseXxx` + `emitXxx` (diagnostyka wierności bajtowej). |

## Flagi globalne

| Flaga           | Cel                                                                      |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Rozwiąż slot pliku względem tego katalogu (domyślnie: `process.cwd()`).  |
| `--file <path>` | Nadpisz rozwiązaną ścieżkę slotu pliku (dostęp bezwzględny).             |
| `--json`        | Wymuś wyjście JSON (domyślne, gdy stdout nie jest TTY).                  |
| `--human`       | Wymuś wyjście dla człowieka (domyślne, gdy stdout jest TTY).             |
| `--dry-run`     | (tylko dla `set`) wypisz bajty, które zostałyby zapisane, bez zapisywania. |
| `--diff`        | (z `set --dry-run`) wypisz zunifikowany diff zamiast pełnych bajtów.      |

## Składnia `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Reguły slotów: `field` wymaga `item`, a `item` wymaga `section`. We wszystkich czterech slotach:

- **Cytowane segmenty** — `"a/b.c"` zachowuje separatory `/` i `.`.
  Zawartość jest dosłowna bajtowo; `"` i `\` nie są dozwolone wewnątrz cudzysłowów.
  Slot pliku również obsługuje cudzysłowy: `oc://"skills/email-drafter"/Tools/$last`
  traktuje `skills/email-drafter` jako jedną ścieżkę pliku.
- **Predykaty** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Operacje numeryczne wymagają, aby obie strony dały się przekształcić do skończonych liczb.
- **Unie** — `{a,b,c}` dopasowuje dowolną z alternatyw.
- **Symbole wieloznaczne** — `*` (pojedynczy podsegment) i `**` (zero lub więcej,
  rekurencyjnie). `find` je akceptuje; `resolve` i `set` odrzucają je jako
  niejednoznaczne.
- **Pozycyjne** — `$first` / `$last` rozwiązują się do pierwszego / ostatniego indeksu albo zadeklarowanego klucza.
- **Porządkowe** — `#N` dla N-tego dopasowania według kolejności w dokumencie.
- **Znaczniki wstawiania** — `+`, `+key`, `+nnn` dla wstawiania z kluczem / indeksem
  (używaj z `set`).
- **Zakres sesji** — `?session=cron-daily` itd. Niezależny od zagnieżdżenia slotów.
  Wartości sesji są surowe, nie dekodowane procentowo; nie mogą zawierać znaków kontrolnych ani zarezerwowanych separatorów zapytania (`?`, `&`, `%`).

Zarezerwowane znaki (`?`, `&`, `%`) poza cytowanymi, predykatowymi lub unijnymi segmentami są odrzucane. Znaki kontrolne (U+0000-U+001F, U+007F) są odrzucane wszędzie, również w wartości zapytania `session`.

`formatOcPath(parseOcPath(path)) === path` jest gwarantowane dla ścieżek kanonicznych.
Niekanoniczne parametry zapytania są ignorowane z wyjątkiem pierwszej niepustej wartości `session=`.

## Adresowanie według rodzaju pliku

| Rodzaj            | Model adresowania                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Sekcje H2 według sluga, elementy listy według sluga lub `#N`, frontmatter przez `[frontmatter]`.    |
| JSONC/JSON        | Klucze obiektów i indeksy tablic; kropki dzielą zagnieżdżone podsegmenty, chyba że są cytowane.     |
| JSONL             | Adresy linii najwyższego poziomu (`L1`, `L2`, `$first`, `$last`), potem zejście w stylu JSONC wewnątrz linii. |
| YAML/YML/.lobster | Klucze map i indeksy sekwencji; komentarze i styl flow są obsługiwane przez API dokumentu YAML.     |

`resolve` zwraca ustrukturyzowane dopasowanie: `root`, `node`, `leaf` albo
`insertion-point`, z 1-indeksowanym numerem linii. Wartości liści są udostępniane jako tekst plus `leafType`, aby autorzy Pluginów mogli renderować podglądy bez zależności od kształtu AST danego rodzaju pliku.

## Kontrakt mutacji

`set` zapisuje jeden konkretny cel:

- Wartości frontmatter markdown i pola elementów `- key: value` są liśćmi tekstowymi.
  Wstawienia markdown dopisują sekcje, klucze frontmatter albo elementy sekcji i
  renderują kanoniczny kształt markdown dla zmienionego pliku.
- Zapisy liści JSONC przekształcają wartość tekstową do istniejącego typu liścia
  (`string`, skończony `number`, `true`/`false` albo `null`). Użyj `--value-json`,
  gdy zamiana liścia JSONC/JSON/JSONL powinna sparsować `<value>` jako JSON i
  może zmienić kształt, na przykład zastępując tekstowy skrót SecretRef obiektem.
  Wstawienia obiektów i tablic JSONC parsują `<value>` jako JSON i używają ścieżki edycji `jsonc-parser` dla zwykłych zapisów liści, zachowując komentarze i pobliskie formatowanie.
- Zapisy liści JSONL przekształcają jak JSONC wewnątrz linii. Zamiana całej linii i
  dopisanie parsują `<value>` jako JSON. Renderowany JSONL zachowuje dominującą w pliku konwencję zakończeń linii LF/CRLF.
- Zapisy liści YAML przekształcają do istniejącego typu skalarnego (`string`, skończony
  `number`, `true`/`false` albo `null`). Wstawienia YAML używają API dokumentu dołączonego pakietu `yaml` do aktualizacji map/sekwencji. Niepoprawne dokumenty YAML z błędami parsera są odrzucane przed mutacją z `parse-error`.

Użyj `--dry-run` przed zapisami widocznymi dla użytkownika, gdy dokładne bajty mają znaczenie. Podłoże zachowuje bajtowo identyczne wyjście dla rund parse/emit, ale mutacja może skanonizować edytowany region lub plik zależnie od rodzaju.
Dodaj `--diff`, gdy chcesz podgląd jako skupioną łatkę przed/po zamiast pełnego wyrenderowanego pliku.

## Przykłady

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Więcej przykładów gramatyki:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Przepisy według rodzaju pliku

Te same pięć czasowników działa we wszystkich rodzajach; schemat adresowania wybiera obsługę na podstawie rozszerzenia pliku. Poniższe przykłady używają fixture’ów z opisu PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Predykat `[frontmatter]` adresuje blok frontmatter YAML; `tools` dopasowuje nagłówek `## Tools` przez slug, a liście elementów zachowują formę sluga nawet wtedy, gdy źródło używa podkreśleń (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Edycje JSONC przechodzą przez `jsonc-parser`, więc komentarze i odstępy przetrwają operację `set`. Najpierw uruchom z `--dry-run`, aby sprawdzić bajty przed zatwierdzeniem.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Każda linia jest rekordem. Adresuj przez predykat (`[event=action]`), gdy nie znasz numeru linii, albo przez kanoniczny segment `LN`, gdy go znasz.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML używa API `Document` pakietu `yaml`, a nie ręcznie pisanego parsera, więc zwykłe cykle parsowania i emitowania zachowują komentarze oraz kształt autorski, podczas gdy rozwiązane ścieżki używają tego samego modelu klucza mapy / indeksu sekwencji co JSONC. Ten sam adapter obsługuje pliki `.yaml`, `.yml` i `.lobster`.

## Dokumentacja podkomend

### `resolve <oc-path>`

Odczytaj pojedynczy liść lub węzeł. Symbole wieloznaczne są odrzucane — do nich użyj `find`. Kończy z kodem `0` przy dopasowaniu, `1` przy czystym braku trafienia, `2` przy błędzie parsowania lub odrzuconym wzorcu.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Wylicz każde dopasowanie dla wzorca z symbolem wieloznacznym / predykatem / unią. Kończy z kodem `0` przy co najmniej jednym dopasowaniu, `1` przy zerze dopasowań. Symbole wieloznaczne w slocie pliku są odrzucane z `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — przekaż konkretny plik (globowanie wielu plików to przyszła funkcja).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Zapisz liść. Połącz z `--dry-run`, aby podejrzeć bajty, które zostałyby zapisane bez dotykania pliku. Dodaj `--diff`, aby uzyskać podgląd zunifikowanego diffu. Kończy z kodem `0` przy udanym zapisie, `1`, jeśli substrat odmawia (na przykład po trafieniu osłony sentinel), `2` przy błędach parsowania.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Znacznik wstawienia `+key` tworzy nazwane dziecko, jeśli jeszcze nie istnieje; `+nnn` i samo `+` działają odpowiednio dla wstawiania indeksowanego i dopisywania.

### `validate <oc-path>`

Kontrola wyłącznie parsowania. Bez dostępu do systemu plików. Przydatne, gdy chcesz potwierdzić, że ścieżka szablonu jest poprawnie uformowana przed podstawieniem zmiennych, albo gdy potrzebujesz strukturalnego rozbicia do debugowania:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Kończy z kodem `0`, gdy jest poprawne, `1`, gdy jest niepoprawne (ze strukturalnym `code` i `message`), `2` przy błędach argumentów.

### `emit <file>`

Przepuść plik w obie strony przez parser i emiter właściwe dla danego rodzaju. Wynik powinien być identyczny bajtowo z wejściem dla poprawnego pliku — rozbieżność wskazuje błąd parsera lub trafienie sentinel. Przydatne do debugowania zachowania substratu na rzeczywistych danych wejściowych.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Kody wyjścia

| Kod | Znaczenie                                                                 |
| --- | ------------------------------------------------------------------------- |
| `0` | Sukces. (`resolve` / `find`: co najmniej jedno dopasowanie. `set`: zapis się powiódł.) |
| `1` | Brak dopasowania albo `set` odrzucony przez substrat (bez błędu na poziomie systemu). |
| `2` | Błąd argumentu lub parsowania.                                             |

## Tryb wyjścia

`openclaw path` rozpoznaje TTY: na terminalu zwraca wyjście czytelne dla człowieka, a JSON, gdy stdout jest potokowany lub przekierowany. `--json` i `--human` nadpisują automatyczne wykrywanie.

## Uwagi

- `set` zapisuje bajty przez ścieżkę emitowania substratu, która automatycznie stosuje osłonę sentinel redakcji. Liść zawierający `__OPENCLAW_REDACTED__` (dosłownie lub jako podciąg) jest odrzucany podczas zapisu.
- Parsowanie JSONC i edycje liści używają zależności `jsonc-parser` lokalnej dla Pluginu, więc komentarze i formatowanie są zachowywane przy zwykłych zapisach liści zamiast przechodzić przez ręcznie napisany parser / ścieżkę ponownego renderowania.
- `path` nie wie o LKG. Jeśli plik jest śledzony przez LKG, następne wywołanie observe decyduje, czy wykonać promowanie / odzyskiwanie. `set --batch` dla atomowego wielokrotnego ustawiania przez cykl życia promowania/odzyskiwania LKG jest planowane razem z substratem odzyskiwania LKG.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
