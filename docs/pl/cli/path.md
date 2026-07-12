---
read_when:
    - Chcesz odczytać lub zapisać element końcowy w pliku obszaru roboczego z poziomu terminala
    - Tworzysz skrypt korzystający ze stanu przestrzeni roboczej i potrzebujesz stabilnego schematu adresowania niezależnego od rodzaju
    - Debugujesz ścieżkę `oc://` (sprawdź poprawność składni i zobacz, do czego jest rozwiązywana)
summary: Dokumentacja CLI dla `openclaw path` (przeglądanie i edytowanie plików obszaru roboczego za pomocą schematu adresowania `oc://`)
title: Ścieżka
x-i18n:
    generated_at: "2026-07-12T15:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Dostęp z powłoki do schematu adresowania `oc://`: jedna składnia ścieżek z obsługą zależną od rodzaju pliku, służąca do przeglądania i edytowania adresowalnych plików przestrzeni roboczej (markdown, jsonc, jsonl, yaml/yml/lobster). Osoby samodzielnie hostujące usługę, autorzy pluginów i rozszerzeń edytorów używają jej do odczytywania, wyszukiwania lub aktualizowania konkretnej lokalizacji bez konieczności samodzielnego tworzenia parsera dla każdego rodzaju pliku.

Polecenie `path` jest udostępniane przez dołączony opcjonalny plugin `oc-path`. Włącz go przed pierwszym użyciem:

```bash
openclaw plugins enable oc-path
```

Czasowniki CLI odzwierciedlają model adresowania:

- `resolve` działa na konkretnym celu i zwraca jedno dopasowanie.
- `find` służy do wyszukiwania wielu dopasowań za pomocą symboli wieloznacznych, unii, predykatów i rozwijania pozycyjnego.
- `set` przyjmuje wyłącznie konkretne ścieżki lub znaczniki wstawiania; wzorce z symbolami wieloznacznymi są odrzucane przed zapisem.
- `validate` analizuje ścieżkę bez dostępu do systemu plików.
- `emit` przeprowadza plik przez cykl analizy i emisji (diagnostyka zgodności na poziomie bajtów).

## Dlaczego warto go używać

Stan OpenClaw jest rozproszony między ręcznie edytowanymi plikami markdown, konfiguracją JSONC z komentarzami, dopisywanymi dziennikami JSONL oraz plikami przepływów pracy i specyfikacji YAML. Skrypty, hooki i agenci często potrzebują z tych plików jednej niewielkiej wartości: klucza frontmatter, ustawienia pluginu, pola rekordu dziennika, kroku YAML albo elementu listy pod nazwaną sekcją.

`openclaw path` zapewnia takim wywołującym stabilny adres zamiast jednorazowego polecenia grep, wyrażenia regularnego lub osobnego parsera dla każdego rodzaju pliku. Tę samą ścieżkę `oc://` można z poziomu terminala zweryfikować, rozwiązać, przeszukać, wykonać próbnie i zapisać, dzięki czemu precyzyjne automatyzacje pozostają łatwe do przeglądania i ponownego wykonania. Narzędzie zachowuje pozostałą część pliku, więc zapis pojedynczej wartości końcowej nie narusza komentarzy, zakończeń wierszy ani pobliskiego formatowania.

Używaj go, gdy żądany element ma logiczny adres, ale struktura pliku może być różna:

- Hook odczytuje jedno ustawienie z pliku JSONC z komentarzami i nie traci komentarzy podczas zapisywania wartości.
- Skrypt konserwacyjny znajduje każde pasujące pole zdarzenia w dzienniku JSONL bez wczytywania całego dziennika do niestandardowego parsera.
- Edytor przechodzi do sekcji lub elementu listy w pliku markdown według slugu, a następnie wyświetla dokładnie rozwiązany wiersz.
- Agent wykonuje próbnie niewielką edycję przestrzeni roboczej przed jej zastosowaniem, a zmienione bajty są widoczne podczas przeglądu.

Nie używaj `openclaw path` do zwykłego edytowania całych plików, rozbudowanych migracji konfiguracji ani zapisów specyficznych dla pamięci; w takich przypadkach należy użyć polecenia lub pluginu będącego właścicielem danej funkcji. `path` jest przeznaczone do małych, adresowalnych operacji na plikach, w których powtarzalne polecenie terminalowe sprawdza się lepiej niż kolejny niestandardowy parser.

## Sposób użycia

Odczyt jednej wartości z ręcznie edytowanego pliku konfiguracyjnego:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Podgląd zapisu bez modyfikowania dysku:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Wyszukiwanie pasujących rekordów w dopisywanym dzienniku JSONL:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresowanie instrukcji w pliku markdown według sekcji i elementu zamiast numeru wiersza:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Walidacja ścieżki w CI lub skrypcie kontroli wstępnej przed wykonaniem przez skrypt odczytu albo zapisu:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Te polecenia zaprojektowano tak, aby można je było kopiować do skryptów powłoki. Użyj `--json`, gdy wywołujący potrzebuje danych wyjściowych o określonej strukturze, a `--human`, gdy wynik przegląda człowiek.

## Sposób działania

1. Analizuje adres `oc://` i dzieli go na pola: plik, sekcję, element, pole oraz opcjonalne zapytanie sesji.
2. Wybiera adapter rodzaju pliku na podstawie rozszerzenia celu (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Rozwiązuje pola względem struktury danego rodzaju pliku: nagłówków i elementów markdown, kluczy obiektów i indeksów tablic JSONC, rekordów wierszy JSONL albo węzłów map i sekwencji YAML.
4. W przypadku `set` emituje edytowane bajty przez ten sam adapter, dzięki czemu niezmienione części pliku zachowują komentarze, zakończenia wierszy i pobliskie formatowanie, jeśli dany format to obsługuje.

`resolve` i `set` wymagają jednego konkretnego celu. `find` jest czasownikiem eksploracyjnym: rozwija symbole wieloznaczne, unie, predykaty i liczebniki porządkowe do konkretnych dopasowań, które można sprawdzić przed wybraniem jednego do zapisu.

## Podpolecenia

| Podpolecenie             | Przeznaczenie                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `resolve <oc-path>`      | Wyświetla konkretne dopasowanie pod daną ścieżką (lub komunikat „nie znaleziono”).                                       |
| `find <pattern>`         | Wylicza dopasowania dla ścieżki z symbolem wieloznacznym, unią lub predykatem.                                            |
| `set <oc-path> <value>`  | Zapisuje wartość końcową lub cel wstawiania pod konkretną ścieżką. Obsługuje `--dry-run`.                                 |
| `validate <oc-path>`     | Tylko analizuje; wyświetla podział strukturalny (plik / sekcja / element / pole).                                         |
| `emit <file>`            | Przeprowadza plik przez cykl analizy i emisji (diagnostyka zgodności na poziomie bajtów).                                 |

## Flagi globalne

| Flaga           | Dotyczy                          | Przeznaczenie                                                                                               |
| --------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Rozwiązuje pole pliku względem tego katalogu (domyślnie: `process.cwd()`).                                   |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Zastępuje rozwiązaną ścieżkę pola pliku (dostęp bezwzględny).                                                |
| `--json`        | wszystkie                        | Wymusza dane wyjściowe JSON (domyślnie, gdy standardowe wyjście nie jest TTY).                              |
| `--human`       | wszystkie                        | Wymusza dane wyjściowe czytelne dla człowieka (domyślnie, gdy standardowe wyjście jest TTY).                |
| `--value-json`  | `set`                            | Analizuje `<value>` jako JSON podczas zastępowania wartości końcowej JSON/JSONC/JSONL.                       |
| `--dry-run`     | `set`                            | Wyświetla bajty, które zostałyby zapisane, bez wykonywania zapisu.                                          |
| `--diff`        | `set` (wymaga `--dry-run`)       | Wyświetla ujednoliconą różnicę zamiast pełnej zawartości bajtowej.                                          |

`validate` przyjmuje wyłącznie `--json` i `--human`; nie uzyskuje dostępu do systemu plików, dlatego `--cwd` ani `--file` nie mają zastosowania.

## Składnia `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Reguły pól: `field` wymaga `item`, a `item` wymaga `section`. We wszystkich czterech polach obowiązują następujące reguły:

- **Segmenty w cudzysłowie** — `"a/b.c"` zachowuje separatory `/` i `.` jako część wartości. Zawartość jest interpretowana dosłownie na poziomie bajtów; znaki `"` i `\` nie są dozwolone wewnątrz cudzysłowów. Pole pliku również uwzględnia cudzysłowy: `oc://"skills/email-drafter"/Tools/$last` traktuje `skills/email-drafter` jako pojedynczą ścieżkę pliku.
- **Predykaty** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Operatory numeryczne wymagają, aby obie strony można było przekształcić na liczby skończone.
- **Unie** — `{a,b,c}` dopasowuje dowolny z wariantów.
- **Symbole wieloznaczne** — `*` (jeden podsegment) i `**` (zero lub więcej, rekursywnie). `find` je przyjmuje, natomiast `resolve` i `set` odrzucają je jako niejednoznaczne.
- **Pozycyjne** — `$first` / `$last` wskazują pierwszy / ostatni indeks albo zadeklarowany klucz.
- **Liczebnik porządkowy** — `#N` oznacza N-te dopasowanie według kolejności w dokumencie.
- **Znaczniki wstawiania** — `+`, `+key`, `+nnn` służą do wstawiania według klucza / indeksu (używane z `set`).
- **Zakres sesji** — `?session=cron-daily` itd. Jest niezależny od zagnieżdżenia pól. Wartości sesji są nieprzetworzone i nie są dekodowane procentowo; nie mogą zawierać znaków sterujących ani zastrzeżonych separatorów zapytania (`?`, `&`, `%`).

Znaki zastrzeżone (`?`, `&`, `%`) poza segmentami w cudzysłowie, predykatami lub uniami są odrzucane. Znaki sterujące (U+0000–U+001F, U+007F) są odrzucane wszędzie, również w wartości zapytania `session`.

Dla ścieżek kanonicznych gwarantowane jest `formatOcPath(parseOcPath(path)) === path`. Niekanoniczne parametry zapytania są ignorowane z wyjątkiem pierwszej niepustej wartości `session=`.

Limity bezwzględne: ścieżka może mieć maksymalnie 4096 bajtów, najwyżej 4 pola (plik/sekcja/element/pole), najwyżej 64 podsegmenty rozdzielone kropkami w każdym polu oraz najwyżej 256 poziomów zagnieżdżonego przechodzenia dla głębokich ścieżek JSON. Niezależnie od tego każdy wejściowy plik JSONC/JSON o rozmiarze przekraczającym 16 MiB jest odrzucany z komunikatem diagnostycznym analizy zamiast analizowania przez dowolny czasownik wczytujący ten plik.

## Adresowanie według rodzaju pliku

| Rodzaj        | Rozszerzenia plików            | Model adresowania                                                                                                           |
| ------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                          | Sekcje H2 według slugu, elementy listy według slugu lub `#N`, frontmatter przez `[frontmatter]`.                             |
| JSONC/JSON    | `.jsonc`, `.json`              | Klucze obiektów i indeksy tablic; kropki rozdzielają zagnieżdżone podsegmenty, chyba że są ujęte w cudzysłowy.                |
| JSONL         | `.jsonl`, `.ndjson`            | Adresy wierszy najwyższego poziomu (`L1`, `L2`, `$first`, `$last`), a następnie przechodzenie wewnątrz wiersza jak w JSONC.  |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`    | Klucze map i indeksy sekwencji; komentarze i styl przepływowy są obsługiwane przez API dokumentu YAML.                       |

`resolve` zwraca ustrukturyzowane dopasowanie: `root`, `node`, `leaf` albo `insertion-point`, wraz z numerem wiersza liczonym od 1. Wartości końcowe są udostępniane jako tekst wraz z `leafType`, dzięki czemu autorzy pluginów mogą wyświetlać podglądy bez zależności od kształtu AST właściwego dla danego rodzaju pliku.

## Kontrakt modyfikacji

`set` zapisuje jeden konkretny cel:

- Wartości frontmatter w markdown oraz pola elementów `- key: value` są tekstowymi wartościami końcowymi. Operacje wstawiania w markdown dopisują sekcje, klucze frontmatter lub elementy sekcji i generują kanoniczną strukturę markdown dla zmienionego pliku. Treści sekcji nie można zapisywać w całości przez `set`.
- Zapisy wartości końcowych JSONC przekształcają wartość tekstową do istniejącego typu wartości końcowej (`string`, skończonego `number`, `true`/`false` albo `null`). Użyj `--value-json`, gdy zastąpienie wartości końcowej JSONC/JSON/JSONL powinno analizować `<value>` jako JSON i może zmienić strukturę, na przykład podczas zastępowania skróconego odwołania do sekretu w postaci ciągu znaków obiektem. Operacje wstawiania do obiektów i tablic JSONC analizują `<value>` jako JSON, a zwykłe zapisy wartości końcowych korzystają ze ścieżki edycji `jsonc-parser`, zachowując komentarze i pobliskie formatowanie.
- Zapisy wartości końcowych JSONL wykonują wewnątrz wiersza takie samo przekształcanie jak JSONC. Zastępowanie całych wierszy i dopisywanie analizuje `<value>` jako JSON. Wygenerowany JSONL zachowuje dominującą w pliku konwencję zakończeń wierszy LF/CRLF (ustalaną większościowo na podstawie zakończeń wierszy w całym pliku, dlatego plik zawierający głównie CRLF pozostaje w formacie CRLF nawet przy kilku przypadkowych LF).
- Zapisy wartości końcowych YAML przekształcają wartość do istniejącego typu skalarnego (`string`, skończonego `number`, `true`/`false` albo `null`). Operacje wstawiania YAML używają API dokumentu dołączonego pakietu `yaml` do aktualizacji map i sekwencji. Nieprawidłowo sformatowane dokumenty YAML zawierające błędy parsera są odrzucane przed modyfikacją z kodem `parse-error`.

Używaj `--dry-run` przed zapisami widocznymi dla użytkownika, gdy znaczenie ma dokładna zawartość bajtowa. Edycje JSONC i YAML modyfikują istniejący dokument (przez `jsonc-parser` lub API dokumentu `yaml`), dlatego niezmienione bajty zwykle zostają zachowane; markdown przy każdej edycji przebudowuje plik z przeanalizowanej struktury, co może ujednolicić nieistotne formatowanie poza zmienioną wartością końcową. Dodaj `--diff`, jeśli podgląd ma mieć postać precyzyjnej poprawki przed/po zamiast pełnego wygenerowanego pliku.

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
# Ujmij w cudzysłów klucze zawierające / lub .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Głębokie ścieżki JSON/JSONC mogą używać segmentów rozdzielonych ukośnikami; są one normalizowane do podsegmentów rozdzielonych kropkami
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Zastąp wartość końcową JSONC przetworzonym obiektem
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Wyszukiwanie predykatowe w elementach podrzędnych JSONC
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Wstaw element do tablicy JSONC
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Wstaw klucz obiektu JSONC
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Dołącz zdarzenie JSONL
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Rozwiąż ostatni wiersz wartości JSONL
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Rozwiąż krok przepływu pracy YAML
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Zaktualizuj wartość skalarną YAML
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Zaadresuj metadane początkowe Markdown
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Wstaw metadane początkowe Markdown
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Znajdź pola elementów Markdown
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Zweryfikuj ścieżkę w zakresie sesji
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Przepisy według rodzaju pliku

Te same pięć czasowników działa dla wszystkich rodzajów plików; schemat adresowania wybiera obsługę na podstawie rozszerzenia pliku.

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
wartość końcowa @ L4: "core" (ciąg znaków)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
wartość końcowa @ L9: "GitHub CLI" (ciąg znaków)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 dopasowania dla oc://x.md/tools/*:
  oc://x.md/tools/gh           →  węzeł @ L9 [md-item]
  oc://x.md/tools/curl         →  węzeł @ L10 [md-item]
  oc://x.md/tools/send-email   →  węzeł @ L11 [md-item]
```

Predykat `[frontmatter]` adresuje blok metadanych początkowych YAML; `tools` dopasowuje nagłówek `## Tools` za pomocą uproszczonego identyfikatora, a wartości końcowe elementów zachowują postać tego identyfikatora nawet wtedy, gdy źródło używa podkreśleń (`send_email` staje się `send-email`).

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
wartość końcowa @ L4: "true" (wartość logiczna)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: zapisano by 142 bajty do /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Edycje JSONC przechodzą przez `jsonc-parser`, dlatego komentarze i odstępy pozostają zachowane po operacji `set`. Najpierw uruchom polecenie z opcją `--dry-run`, aby sprawdzić bajty przed zatwierdzeniem zmian. Pliki `.json` używają tego samego adaptera i tej samej ścieżki edycji co pliki `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 dopasowanie dla oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  wartość końcowa @ L2: "u1" (ciąg znaków)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
wartość końcowa @ L2: "2" (liczba)
```

Każdy wiersz jest rekordem. Adresuj go za pomocą predykatu (`[event=action]`), gdy nie znasz numeru wiersza, albo za pomocą kanonicznego segmentu `LN`, gdy go znasz. Pliki `.ndjson` używają tego samego adaptera co pliki `.jsonl`.

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
wartość końcowa @ L3: "fetch" (ciąg znaków)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: zapisano by 99 bajtów do /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML używa interfejsu API `Document` pakietu `yaml` zamiast parsera napisanego ręcznie, dlatego zwykłe cykle analizy i emisji zachowują komentarze oraz strukturę zapisu, a rozwiązane ścieżki korzystają z tego samego modelu klucza mapy i indeksu sekwencji co JSONC. Ten sam adapter obsługuje pliki `.yaml`, `.yml` i `.lobster`.

## Dokumentacja podpoleceń

### `resolve <oc-path>`

Odczytuje pojedynczą wartość końcową lub węzeł. Symbole wieloznaczne są odrzucane — użyj dla nich polecenia `find`. Kończy działanie z kodem `0` w przypadku dopasowania, `1` w przypadku prawidłowego braku dopasowania oraz `2` w przypadku błędu analizy lub odrzuconego wzorca.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Wylicza wszystkie dopasowania wzorca z symbolem wieloznacznym, predykatem lub sumą. Kończy działanie z kodem `0`, jeśli istnieje co najmniej jedno dopasowanie, lub `1`, jeśli nie ma żadnego. Symbole wieloznaczne w miejscu pliku są odrzucane z kodem `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — podaj konkretny plik (obsługa globowania wielu plików jest planowaną funkcją).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Zapisuje wartość końcową. Użyj razem z opcją `--dry-run`, aby wyświetlić podgląd bajtów, które zostałyby zapisane, bez modyfikowania pliku. Dodaj opcję `--diff`, aby wyświetlić podgląd ujednoliconej różnicy. Kończy działanie z kodem `0` po pomyślnym zapisie, `1`, jeśli warstwa bazowa odrzuci operację (na przykład po zadziałaniu zabezpieczenia wartości wartowniczej), lub `2` w przypadku błędów analizy.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Znacznik wstawiania `+key` tworzy wskazany element podrzędny, jeśli jeszcze nie istnieje; `+nnn` i samo `+` służą odpowiednio do wstawiania według indeksu i dołączania.

### `validate <oc-path>`

Sprawdza wyłącznie poprawność składni. Nie uzyskuje dostępu do systemu plików. Jest przydatne, gdy chcesz potwierdzić, że ścieżka szablonu ma poprawną postać przed podstawieniem zmiennych, lub uzyskać podział strukturalny do debugowania:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
poprawna: oc://AGENTS.md/tools/gh
  plik:     AGENTS.md
  sekcja:   tools
  element:  gh
```

Kończy działanie z kodem `0`, gdy ścieżka jest poprawna, `1`, gdy jest niepoprawna (ze strukturalnymi polami `code` i `message`), lub `2` w przypadku błędów argumentów.

### `emit <file>`

Przeprowadza plik przez parser i emiter właściwe dla jego rodzaju. Dla poprawnego pliku dane wyjściowe powinny być identyczne bajt po bajcie z danymi wejściowymi; rozbieżność wskazuje błąd parsera lub zadziałanie wartości wartowniczej. Jest przydatne do debugowania zachowania warstwy bazowej na rzeczywistych danych wejściowych.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Kody zakończenia

| Kod | Znaczenie                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------- |
| `0` | Powodzenie. (`resolve` / `find`: co najmniej jedno dopasowanie. `set`: zapis zakończył się powodzeniem.) |
| `1` | Brak dopasowania lub odrzucenie `set` przez warstwę bazową (bez błędu na poziomie systemu).            |
| `2` | Błąd argumentu lub analizy.                                                                           |

## Tryb wyjściowy

`openclaw path` wykrywa TTY: w terminalu generuje dane wyjściowe czytelne dla człowieka, a po przekierowaniu standardowego wyjścia lub przesłaniu go potokiem — JSON. Opcje `--json` i `--human` zastępują automatyczne wykrywanie.

## Uwagi

- `set` zapisuje bajty przez ścieżkę emisji warstwy bazowej, która automatycznie stosuje zabezpieczenie wartości wartowniczej redakcji. Zapis wartości końcowej zawierającej `__OPENCLAW_REDACTED__` (dosłownie lub jako podciąg) zostanie odrzucony.
- Analiza JSONC i edycje wartości końcowych używają lokalnej dla pluginu zależności `jsonc-parser`, dlatego zwykłe zapisy wartości końcowych zachowują komentarze i formatowanie zamiast korzystać z ręcznie napisanego parsera i ponownego renderowania.
- `path` nie uwzględnia śledzenia ani odzyskiwania ostatniej znanej poprawnej konfiguracji (LKG); ten cykl życia jest obsługiwany w innym miejscu. Jeśli plik edytowany za pomocą `path` jest również śledzony jako LKG, następny odczyt konfiguracji zdecyduje, czy go zatwierdzić, czy odzyskać; traktuj edycję za pomocą `path` tak samo jak każdy inny bezpośredni zapis do tego pliku.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
