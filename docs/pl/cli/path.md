---
read_when:
    - Chcesz odczytać lub zapisać liść w pliku w obszarze roboczym z terminala
    - Tworzysz skrypty operujące na stanie obszaru roboczego i chcesz stabilnego schematu adresowania niezależnego od rodzaju
    - Debugujesz ścieżkę `oc://` (sprawdź składnię i zobacz, do czego się rozwija)
summary: Dokumentacja referencyjna CLI dla `openclaw path` (sprawdzanie i edytowanie plików obszaru roboczego za pomocą schematu adresowania `oc://`)
title: Ścieżka
x-i18n:
    generated_at: "2026-05-10T19:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Dostarczany przez Plugin dostęp powłoki do podłoża adresowania `oc://`: jeden
schemat ścieżek rozdzielany według rodzaju do inspekcji i edycji adresowalnych
plików przestrzeni roboczej (markdown, jsonc, jsonl). Osoby hostujące samodzielnie,
autorzy Pluginów i rozszerzenia edytorów używają go do odczytywania, znajdowania
lub aktualizowania wąskiej lokalizacji bez ręcznego tworzenia parserów dla
każdego pliku.

CLI odzwierciedla publiczne czasowniki podłoża:

- `resolve` jest konkretny i zwraca pojedyncze dopasowanie.
- `find` jest czasownikiem dla wielu dopasowań: symboli wieloznacznych, unii, predykatów i
  rozwijania pozycyjnego.
- `set` przyjmuje tylko konkretne ścieżki lub znaczniki wstawiania; wzorce z symbolami wieloznacznymi są
  odrzucane przed zapisem.

`path` jest udostępniany przez dołączony opcjonalny Plugin `oc-path`. Włącz go przed
pierwszym użyciem:

```bash
openclaw plugins enable oc-path
```

## Dlaczego warto go używać

Stan OpenClaw jest rozproszony między edytowanymi przez ludzi plikami markdown, komentowaną konfiguracją JSONC
i dziennikami JSONL tylko do dopisywania. Skrypty powłoki, hooki i agenci często potrzebują jednej
małej wartości z tych plików: klucza frontmatter, ustawienia Pluginu, pola rekordu dziennika
lub elementu listy pod nazwaną sekcją.

`openclaw path` daje takim wywołującym stabilny adres zamiast jednorazowego grep,
wyrażenia regularnego albo parsera dla każdego rodzaju pliku. Tę samą ścieżkę `oc://` można zweryfikować,
rozwiązać, przeszukać, uruchomić próbnie i zapisać z terminala, co ułatwia przeglądanie
wąskiej automatyzacji i czyni jej ponowne odtworzenie bezpieczniejszym. Jest to szczególnie przydatne, gdy
chcesz zaktualizować jeden liść, zachowując resztę komentarzy pliku,
zakończeń linii i otaczającego formatowania.

Użyj go, gdy rzecz, której chcesz, ma logiczny adres, ale fizyczny kształt pliku
jest różny:

- Hook chce odczytać jedno ustawienie z komentowanego JSONC bez utraty komentarzy
  przy zapisywaniu wartości z powrotem.
- Skrypt utrzymaniowy chce znaleźć każde pasujące pole zdarzenia w dzienniku JSONL
  bez wczytywania całego dziennika do niestandardowego parsera.
- Rozszerzenie edytora chce przejść do sekcji markdown lub elementu listy według
  sluga, a następnie wyrenderować dokładną linię, do której ścieżka została rozwiązana.
- Agent chce próbnie uruchomić drobną edycję przestrzeni roboczej przed jej zastosowaniem, z
  widocznymi w przeglądzie zmienionymi bajtami.

Prawdopodobnie nie potrzebujesz `openclaw path` do zwykłych edycji całych plików, rozbudowanych
migracji konfiguracji ani zapisów specyficznych dla pamięci. One powinny używać polecenia właściciela
lub Pluginu. `path` służy do małych, adresowalnych operacji na plikach, w których
powtarzalne polecenie terminala jest czytelniejsze niż kolejny dedykowany parser.

## Jak jest używany

Odczytaj jedną wartość z edytowanego przez człowieka pliku konfiguracyjnego:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Podejrzyj zapis bez dotykania dysku:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Znajdź pasujące rekordy w dzienniku JSONL tylko do dopisywania:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Zaadresuj instrukcję w markdown według sekcji i elementu zamiast według numeru
linii:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Zweryfikuj ścieżkę w CI lub skrypcie preflight, zanim skrypt odczyta lub zapisze:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Te polecenia mają nadawać się do kopiowania do skryptów powłoki. Użyj `--json`, gdy
wywołujący potrzebuje ustrukturyzowanego wyjścia, i `--human`, gdy osoba sprawdza
wynik.

## Jak to działa

`openclaw path` robi cztery rzeczy:

1. Parsuje adres `oc://` na sloty: plik, sekcja, element, pole i
   opcjonalna sesja.
2. Wybiera adapter rodzaju pliku na podstawie docelowego rozszerzenia (`.md`, `.jsonc`,
   `.jsonl` i powiązanych aliasów).
3. Rozwiązuje sloty względem AST tego rodzaju pliku: nagłówków/elementów markdown,
   kluczy obiektów/indeksów tablic JSONC albo rekordów linii JSONL.
4. Dla `set` emituje edytowane bajty przez ten sam adapter, aby nietknięte
   części pliku zachowały komentarze, zakończenia linii i pobliskie formatowanie
   tam, gdzie dany rodzaj to obsługuje.

`resolve` i `set` wymagają jednego konkretnego celu. `find` jest czasownikiem eksploracyjnym:
rozwija symbole wieloznaczne, unie, predykaty i liczebniki porządkowe do konkretnych
dopasowań, które możesz sprawdzić przed wybraniem jednego do zapisu.

## Podpolecenia

| Podpolecenie            | Cel                                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Wypisz konkretne dopasowanie pod ścieżką (albo „nie znaleziono”).            |
| `find <pattern>`        | Wylicz dopasowania dla ścieżki z symbolem wieloznacznym / unią / predykatem. |
| `set <oc-path> <value>` | Zapisz liść lub cel wstawiania pod konkretną ścieżką. Obsługuje `--dry-run`. |
| `validate <oc-path>`    | Tylko parsowanie; wypisz strukturalny podział (plik / sekcja / element / pole). |
| `emit <file>`           | Przeprowadź plik przez rundę `parseXxx` + `emitXxx` (diagnostyka wierności bajtowej). |

## Flagi globalne

| Flaga           | Cel                                                                      |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Rozwiąż slot pliku względem tego katalogu (domyślnie: `process.cwd()`).  |
| `--file <path>` | Nadpisz rozwiązaną ścieżkę slotu pliku (dostęp bezwzględny).             |
| `--json`        | Wymuś wyjście JSON (domyślnie, gdy stdout nie jest TTY).                 |
| `--human`       | Wymuś wyjście czytelne dla człowieka (domyślnie, gdy stdout jest TTY).   |
| `--dry-run`     | (tylko w `set`) wypisz bajty, które zostałyby zapisane, bez zapisu.      |

## Składnia `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Zasady slotów: `field` wymaga `item`, a `item` wymaga `section`. We wszystkich
czterech slotach:

- **Segmenty cytowane** — `"a/b.c"` zachowuje separatory `/` i `.`.
  Zawartość jest bajtowo dosłowna; `"` i `\` nie są dozwolone wewnątrz cudzysłowów.
  Slot pliku także uwzględnia cudzysłowy: `oc://"skills/email-drafter"/Tools/$last`
  traktuje `skills/email-drafter` jako pojedynczą ścieżkę pliku.
- **Predykaty** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Operacje numeryczne wymagają, aby obie strony dało się przekształcić do skończonych liczb.
- **Unie** — `{a,b,c}` dopasowuje dowolną z alternatyw.
- **Symbole wieloznaczne** — `*` (pojedynczy podsegment) i `**` (zero lub więcej,
  rekurencyjnie). `find` je akceptuje; `resolve` i `set` odrzucają je jako
  niejednoznaczne.
- **Pozycyjne** — `$last` rozwiązuje się do ostatniego indeksu / ostatnio zadeklarowanego klucza.
- **Porządkowe** — `#N` dla N-tego dopasowania według kolejności dokumentu.
- **Znaczniki wstawiania** — `+`, `+key`, `+nnn` dla wstawiania z kluczem / indeksem
  (używaj z `set`).
- **Zakres sesji** — `?session=cron-daily` itd. Niezależny od zagnieżdżenia
  slotów. Wartości sesji są surowe, nie są dekodowane procentowo; nie mogą zawierać
  znaków sterujących ani zastrzeżonych ograniczników zapytania (`?`, `&`, `%`).

Znaki zastrzeżone (`?`, `&`, `%`) poza segmentami cytowanymi, predykatowymi lub unii
są odrzucane. Znaki sterujące (U+0000-U+001F, U+007F) są odrzucane
wszędzie, w tym w wartości zapytania `session`.

`formatOcPath(parseOcPath(path)) === path` jest gwarantowane dla ścieżek kanonicznych.
Niekanoniczne parametry zapytania są ignorowane poza pierwszą niepustą
wartością `session=`.

## Adresowanie według rodzaju pliku

| Rodzaj     | Model adresowania                                                                       |
| ---------- | --------------------------------------------------------------------------------------- |
| Markdown   | Sekcje H2 według sluga, elementy list według sluga lub `#N`, frontmatter przez `[frontmatter]`. |
| JSONC/JSON | Klucze obiektów i indeksy tablic; kropki dzielą zagnieżdżone podsegmenty, chyba że są cytowane. |
| JSONL      | Adresy linii najwyższego poziomu (`L1`, `L2`, `$last`), potem zejście w stylu JSONC wewnątrz linii. |

`resolve` zwraca ustrukturyzowane dopasowanie: `root`, `node`, `leaf` albo
`insertion-point`, z numerem linii liczonym od 1. Wartości liści są prezentowane jako tekst
plus `leafType`, aby autorzy Pluginów mogli renderować podglądy bez zależności od
kształtu AST danego rodzaju.

## Kontrakt mutacji

`set` zapisuje jeden konkretny cel:

- Wartości frontmatter markdown i pola elementów `- key: value` są liśćmi tekstowymi.
  Wstawienia markdown dopisują sekcje, klucze frontmatter lub elementy sekcji oraz
  renderują kanoniczny kształt markdown dla zmienionego pliku.
- Zapisy liści JSONC przekształcają wartość tekstową do istniejącego typu liścia
  (`string`, skończony `number`, `true`/`false` albo `null`). Wstawienia obiektów i tablic
  JSONC parsują `<value>` jako JSON i używają ścieżki edycji `jsonc-parser` dla
  zwykłych zapisów liści, zachowując komentarze i pobliskie formatowanie.
- Zapisy liści JSONL przekształcają jak JSONC wewnątrz linii. Zastąpienie całej linii i
  dopisanie parsują `<value>` jako JSON. Renderowany JSONL zachowuje dominującą w pliku
  konwencję zakończeń linii LF/CRLF.

Użyj `--dry-run` przed zapisami widocznymi dla użytkownika, gdy dokładne bajty mają znaczenie. Podłoże
zachowuje bajtowo identyczne wyjście dla rund parse/emit, ale
mutacja może kanonizować edytowany region lub plik zależnie od rodzaju.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Więcej przykładów gramatyki:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Tych samych pięciu czasowników działa we wszystkich rodzajach; schemat adresowania wybiera sposób obsługi na podstawie
rozszerzenia pliku. Poniższe przykłady używają fikstur z opisu PR.

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

Predykat `[frontmatter]` adresuje blok YAML frontmatter; `tools`
dopasowuje nagłówek `## Tools` przez sluga, a liście elementów zachowują swoją formę sluga
nawet gdy źródło używa podkreśleń (`send_email` → `send-email`).

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

Edycje JSONC przechodzą przez `jsonc-parser`, więc komentarze i białe znaki przetrwają
`set`. Najpierw uruchom z `--dry-run`, aby sprawdzić bajty przed zatwierdzeniem zmian.

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

Każdy wiersz jest rekordem. Adresuj za pomocą predykatu (`[event=action]`), gdy nie
znasz numeru wiersza, albo za pomocą kanonicznego segmentu `LN`, gdy go znasz.

## Opis podpoleceń

### `resolve <oc-path>`

Odczytaj pojedynczy liść lub węzeł. Symbole wieloznaczne są odrzucane — użyj do nich `find`.
Kończy działanie z kodem `0` przy dopasowaniu, `1` przy czystym braku trafienia, `2` przy błędzie parsowania lub odrzuconym
wzorcu.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Wylicz każde dopasowanie wzorca z symbolem wieloznacznym / predykatem / unią. Kończy działanie z kodem `0`
przy co najmniej jednym dopasowaniu, `1` przy zerze. Symbole wieloznaczne w miejscu pliku są odrzucane z
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — przekaż konkretny plik (globbing wielu plików
to funkcja planowana na później).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Zapisz liść. Połącz z `--dry-run`, aby podejrzeć bajty, które zostałyby
zapisane bez modyfikowania pliku. Kończy działanie z kodem `0` przy udanym zapisie, `1`, jeśli
substrat odmówi (na przykład po trafieniu na strażnika sentinel), `2` przy błędach
parsowania.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Znacznik wstawiania `+key` tworzy nazwany element potomny, jeśli jeszcze
nie istnieje; `+nnn` i samo `+` działają odpowiednio dla wstawiania według indeksu i dopisywania.

### `validate <oc-path>`

Sprawdzenie wyłącznie parsowania. Bez dostępu do systemu plików. Przydatne, gdy chcesz potwierdzić, że
ścieżka szablonu ma poprawną postać przed podstawieniem zmiennych, albo gdy chcesz
uzyskać rozbicie strukturalne do debugowania:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Kończy się kodem `0`, gdy wartość jest poprawna, `1`, gdy jest niepoprawna (ze strukturalnym `code` i
`message`), `2` przy błędach argumentów.

### `emit <file>`

Przepuszcza plik tam i z powrotem przez parser i emiter właściwe dla danego rodzaju. Wyjście powinno
być identyczne bajtowo z wejściem w poprawnym pliku — rozbieżność wskazuje na
błąd parsera albo trafienie na sentinel. Przydatne do debugowania zachowania substratu na
rzeczywistych danych wejściowych.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Kody wyjścia

| Kod | Znaczenie                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Sukces. (`resolve` / `find`: co najmniej jedno dopasowanie. `set`: zapis się powiódł.) |
| `1`  | Brak dopasowania albo `set` odrzucone przez substrat (bez błędu na poziomie systemu).      |
| `2`  | Błąd argumentu lub parsowania.                                                   |

## Tryb wyjścia

`openclaw path` rozpoznaje TTY: czytelne dla człowieka wyjście w terminalu, JSON, gdy
stdout jest potokowany albo przekierowany. `--json` i `--human` zastępują
automatyczne wykrywanie.

## Uwagi

- `set` zapisuje bajty przez ścieżkę emitowania substratu, która automatycznie stosuje
  zabezpieczenie redaction-sentinel. Liść zawierający
  `__OPENCLAW_REDACTED__` (dosłownie albo jako podciąg) jest odrzucany podczas
  zapisu.
- Parsowanie JSONC i edycje liści używają lokalnej dla Plugin zależności `jsonc-parser`,
  więc komentarze i formatowanie są zachowywane przy zwykłych zapisach liści,
  zamiast przechodzić przez ręcznie napisany parser i ścieżkę ponownego renderowania.
- `path` nie wie o LKG. Jeśli plik jest śledzony przez LKG, następne
  wywołanie observe decyduje, czy wykonać promote / recover. `set --batch` dla
  atomowego multi-set przez cykl życia promote/recover LKG jest planowane
  razem z substratem odzyskiwania LKG.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
