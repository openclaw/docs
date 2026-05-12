---
read_when:
    - Korzystanie z CLI ClawHub
    - Debugowanie instalacji, aktualizacji, publikowania lub synchronizacji
summary: 'Dokumentacja referencyjna CLI: polecenia, flagi, konfiguracja, plik blokady, zachowanie synchronizacji.'
x-i18n:
    generated_at: "2026-05-12T23:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pakiet CLI: `clawhub`, bin: `clawhub`.

Zainstaluj go globalnie za pomocą npm lub pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Następnie zweryfikuj go:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flagi globalne

- `--workdir <dir>`: katalog roboczy (domyślnie: cwd; przełącza się na przestrzeń roboczą Clawdbot, jeśli jest skonfigurowana)
- `--dir <dir>`: katalog instalacji pod workdir (domyślnie: `skills`)
- `--site <url>`: bazowy URL do logowania w przeglądarce (domyślnie: `https://clawhub.ai`)
- `--registry <url>`: bazowy URL API (domyślnie: wykryty, w przeciwnym razie `https://clawhub.ai`)
- `--no-input`: wyłącz monity

Odpowiedniki w zmiennych środowiskowych:

- `CLAWHUB_SITE` (starsze `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (starsze `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (starsze `CLAWDHUB_WORKDIR`)

### Proxy HTTP

CLI respektuje standardowe zmienne środowiskowe proxy HTTP w systemach za
proxy firmowymi lub w ograniczonych sieciach:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Gdy ustawiona jest dowolna z tych zmiennych, CLI kieruje żądania wychodzące przez
określone proxy. `HTTPS_PROXY` jest używane dla żądań HTTPS, `HTTP_PROXY`
dla zwykłego HTTP. `NO_PROXY` / `no_proxy` jest respektowane, aby pominąć proxy dla
określonych hostów lub domen.

Jest to wymagane w systemach, w których bezpośrednie połączenia wychodzące są blokowane
(np. kontenery Docker, Hetzner VPS z internetem tylko przez proxy, firmowe
zapory sieciowe).

Przykład:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Gdy nie ustawiono żadnej zmiennej proxy, zachowanie pozostaje bez zmian (połączenia bezpośrednie).

## Plik konfiguracji

Przechowuje token API i zapisany w pamięci podręcznej URL rejestru.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Starszy fallback: jeśli `clawhub/config.json` jeszcze nie istnieje, ale istnieje `clawdhub/config.json`, CLI ponownie używa starszej ścieżki
- nadpisanie: `CLAWHUB_CONFIG_PATH` (starsze `CLAWDHUB_CONFIG_PATH`)

## Polecenia

### `login` / `auth login`

- Domyślnie: otwiera przeglądarkę pod adresem `<site>/cli/auth` i kończy przez wywołanie zwrotne loopback.
- Bez interfejsu graficznego: `clawhub login --token clh_...`
- Zdalnie/interaktywnie bez interfejsu graficznego: `clawhub login --device` wyświetla kod i czeka, aż autoryzujesz go pod adresem `<site>/cli/device`.

### `whoami`

- Weryfikuje zapisany token przez `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Dodaje/usuwa umiejętność z wyróżnionych.
- Wywołuje `POST /api/v1/stars/<slug>` i `DELETE /api/v1/stars/<slug>`.
- `--yes` pomija potwierdzenie.

### `search <query...>`

- Wywołuje `/api/v1/search?q=...`.
- Wyszukiwanie preferuje dokładne dopasowania tokenów slug/nazwa przed popularnością pobrań. Samodzielny token slug, taki jak `map`, dopasowuje `personal-map` mocniej niż podciąg wewnątrz `amap`.
- Pobrania są niewielkim wcześniejszym sygnałem popularności, a nie gwarancją najwyższej pozycji.
- Jeśli umiejętność powinna się pojawić, ale się nie pojawia, uruchom `clawhub inspect <slug>` po zalogowaniu, aby sprawdzić widoczne dla właściciela diagnostyki moderacji przed zmianą nazw metadanych.

### `explore`

- Wyświetla najnowsze umiejętności przez `/api/v1/skills?limit=...&sort=createdAt` (posortowane malejąco według `createdAt`).
- Flagi:
  - `--limit <n>` (1-200, domyślnie: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (domyślnie: newest)
  - `--json` (wynik czytelny dla maszyn)
- Wynik: `<slug>  v<version>  <age>  <summary>` (podsumowanie skrócone do 50 znaków).

### `inspect <slug>`

- Pobiera metadane umiejętności i pliki wersji bez instalowania.
- `--version <version>`: sprawdź określoną wersję (domyślnie: najnowsza).
- `--tag <tag>`: sprawdź oznaczoną tagiem wersję (np. `latest`).
- `--versions`: wyświetl historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wyświetlenia (1-200).
- `--files`: wyświetl pliki dla wybranej wersji.
- `--file <path>`: pobierz surową zawartość pliku (tylko pliki tekstowe; limit 200 KB).
- `--json`: wynik czytelny dla maszyn.

### `install <slug>`

- Rozwiązuje najnowszą wersję przez `/api/v1/skills/<slug>`.
- Pobiera zip przez `/api/v1/download`.
- Wypakowuje do `<workdir>/<dir>/<slug>`.
- Odmawia nadpisania przypiętych umiejętności; najpierw uruchom `clawhub unpin <slug>`.
- Zapisuje:
  - `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

### `uninstall <slug>`

- Usuwa `<workdir>/<dir>/<slug>` i kasuje wpis w pliku blokady.
- Interaktywnie: prosi o potwierdzenie.
- Nieinteraktywnie (`--no-input`): wymaga `--yes`.

### `list`

- Odczytuje `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`).
- Pokazuje `pinned` obok umiejętności zamrożonych za pomocą `clawhub pin`, w tym opcjonalny powód.

### `pin <slug>`

- Oznacza zainstalowaną umiejętność jako przypiętą w pliku blokady.
- `--reason <text>` zapisuje, dlaczego umiejętność jest zamrożona.
- Przypięte umiejętności są pomijane przez `update --all` i odrzucane przez bezpośrednie `update <slug>`.
- Przypięte umiejętności odrzucają także `install --force`, aby lokalne bajty nie zostały przypadkowo zastąpione.

### `unpin <slug>`

- Usuwa przypięcie z pliku blokady dla zainstalowanej umiejętności, aby przyszłe aktualizacje mogły ją modyfikować.

### `update [slug]` / `update --all`

- Oblicza fingerprint z lokalnych plików.
- Jeśli fingerprint pasuje do znanej wersji: bez monitu.
- Jeśli fingerprint nie pasuje:
  - domyślnie odmawia
  - nadpisuje z `--force` (lub po monicie, jeśli interaktywnie)
- Przypięte umiejętności nigdy nie są aktualizowane przez `--force`.
- `update <slug>` szybko kończy się niepowodzeniem dla przypiętych slugów i informuje, aby najpierw uruchomić `clawhub unpin <slug>`.
- `update --all` pomija przypięte slugi i wypisuje podsumowanie tego, co pozostało zamrożone.

### `skill publish <path>`

- Publikuje przez `POST /api/v1/skills` (multipart).
- Wymaga semver: `--version 1.2.3`.
- `--owner <handle>` publikuje pod uchwytem wydawcy organizacji/użytkownika, gdy
  aktor ma dostęp wydawcy.
- `--migrate-owner` przenosi istniejącą umiejętność do `--owner` podczas publikowania nowej
  wersji. Wymaga dostępu administratora/właściciela u obu wydawców.
- Zachowanie właściciela i recenzji wyjaśnia `docs/publishing.md`.
- Opublikowanie umiejętności oznacza, że zostaje wydana w ClawHub na licencji `MIT-0`.
- Opublikowane umiejętności można bezpłatnie używać, modyfikować i redystrybuować bez przypisania autorstwa.
- ClawHub nie obsługuje płatnych umiejętności ani wyceny poszczególnych umiejętności.
- `--clawscan-note <text>` dodaje notatkę ClawScan. Ta notatka daje ClawScan
  kontekst dotyczący zachowania, które w innym przypadku mogłoby wyglądać nietypowo, takiego jak dostęp do sieci,
  dostęp do natywnego hosta lub poświadczenia specyficzne dla dostawcy. Notatka jest przechowywana w
  opublikowanej wersji.
- Starszy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Miękko usuwa umiejętność (właściciel, moderator lub administrator).
- Wywołuje `DELETE /api/v1/skills/{slug}`.
- Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni; polecenie wypisuje czas wygaśnięcia.
- `--reason <text>` zapisuje notatkę moderacyjną przy umiejętności i w dzienniku audytu.
- `--note <text>` jest aliasem dla `--reason`.
- `--yes` pomija potwierdzenie.

### `undelete <slug>`

- Przywraca ukrytą umiejętność (właściciel, moderator lub administrator).
- Wywołuje `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` zapisuje notatkę moderacyjną przy umiejętności i w dzienniku audytu.
- `--note <text>` jest aliasem dla `--reason`.
- `--yes` pomija potwierdzenie.

### `hide <slug>`

- Ukrywa umiejętność (właściciel, moderator lub administrator).
- Alias dla `delete`.

### `unhide <slug>`

- Odkrywa umiejętność (właściciel, moderator lub administrator).
- Alias dla `undelete`.

### `skill rename <slug> <new-slug>`

- Zmienia nazwę posiadanej umiejętności i zachowuje poprzedni slug jako alias przekierowania.
- Wywołuje `POST /api/v1/skills/{slug}/rename`.
- `--yes` pomija potwierdzenie.

### `skill merge <source-slug> <target-slug>`

- Scala jedną posiadaną umiejętność z inną posiadaną umiejętnością.
- Slug źródłowy przestaje być publicznie wyświetlany i staje się aliasem przekierowania do celu.
- Wywołuje `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pomija potwierdzenie.

### `transfer`

- Przepływ pracy przeniesienia własności.
- Przeniesienia do uchwytów użytkowników tworzą oczekujące żądanie, które odbiorca akceptuje.
- Przeniesienia do uchwytów organizacji/wydawców są stosowane natychmiast tylko wtedy, gdy aktor ma
  dostęp administratora zarówno do bieżącego właściciela, jak i wydawcy docelowego.
- Podpolecenia:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Punkty końcowe:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Przegląda lub przeszukuje ujednolicony katalog pakietów przez `GET /api/v1/packages` i `GET /api/v1/packages/search`.
- Użyj tego dla plugins i innych wpisów z rodziny pakietów; najwyższego poziomu `search` pozostaje powierzchnią wyszukiwania umiejętności.
- Flagi:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, domyślnie: 25)
  - `--json`

Przykłady:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Pobiera metadane pakietu bez instalowania.
- Użyj tego do metadanych plugin, zgodności, weryfikacji, źródła oraz inspekcji wersji/plików.
- `--version <version>`: sprawdź konkretną wersję (domyślnie: najnowsza).
- `--tag <tag>`: sprawdź oznaczoną wersję (np. `latest`).
- `--versions`: wyświetl historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wyświetlenia (1-100).
- `--files`: wyświetl pliki dla wybranej wersji.
- `--file <path>`: pobierz surową zawartość pliku (tylko pliki tekstowe; limit 200 KB).
- `--json`: dane wyjściowe czytelne maszynowo.

### `package download <name>`

- Rozwiązuje wersję pakietu przez
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Pobiera artefakt z `downloadUrl` resolvera.
- Weryfikuje ClawHub SHA-256 dla wszystkich artefaktów.
- Dla artefaktów ClawPack npm-pack weryfikuje także integralność npm `sha512`,
  npm shasum oraz nazwę/wersję w `package.json` tarballa.
- Starsze wersje ZIP są pobierane przez starszą trasę ZIP.
- Flagi:
  - `--version <version>`: pobierz konkretną wersję.
  - `--tag <tag>`: pobierz oznaczoną wersję (domyślnie: `latest`).
  - `-o, --output <path>`: plik lub katalog wyjściowy.
  - `--force`: nadpisz istniejący plik wyjściowy.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykłady:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Oblicza ClawHub SHA-256, integralność npm `sha512` i npm shasum dla lokalnego
  artefaktu.
- Z `--package` rozwiązuje oczekiwane metadane z ClawHub i porównuje
  lokalny plik z opublikowanymi metadanymi artefaktu.
- Z bezpośrednimi flagami skrótu weryfikuje bez odpytywania sieci.
- Flagi:
  - `--package <name>`: nazwa pakietu do rozwiązania oczekiwanych metadanych artefaktu.
  - `--version <version>` lub `--tag <tag>`: oczekiwana wersja pakietu.
  - `--sha256 <hex>`: oczekiwany ClawHub SHA-256.
  - `--npm-integrity <sri>`: oczekiwana integralność npm.
  - `--npm-shasum <sha1>`: oczekiwany npm shasum.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykłady:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Miękko usuwa pakiet i wszystkie wydania.
- Wymaga właściciela pakietu, właściciela/administratora wydawcy organizacji, moderatora platformy
  lub administratora platformy.
- Flagi:
  - `--yes`: pomija potwierdzenie.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Przywraca miękko usunięty pakiet i wydania.
- Wymaga właściciela pakietu, właściciela/administratora wydawcy organizacji, moderatora platformy
  lub administratora platformy.
- Wywołuje `POST /api/v1/packages/{name}/undelete`.
- Flagi:
  - `--yes`: pomija potwierdzenie.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Przenosi pakiet do innego wydawcy.
- Wymaga dostępu administratora zarówno do bieżącego właściciela pakietu, jak i docelowego
  wydawcy, chyba że operację wykonuje administrator platformy.
- Nazwy pakietów z zakresem muszą zostać przeniesione do właściciela pasującego zakresu.
- Wywołuje `POST /api/v1/packages/{name}/transfer`.
- Flagi:
  - `--to <owner>`: identyfikator docelowego wydawcy.
  - `--reason <text>`: opcjonalny powód audytowy.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Uwierzytelnione polecenie do zgłaszania pakietu moderatorom.
- Wywołuje `POST /api/v1/packages/{name}/report`.
- Zgłoszenia dotyczą poziomu pakietu, opcjonalnie są powiązane z wersją i stają się widoczne
  dla moderatorów do sprawdzenia.
- Zgłoszenia same w sobie nie ukrywają automatycznie pakietów ani nie blokują pobierania.
- Flagi:
  - `--version <version>`: opcjonalna wersja pakietu do dołączenia do zgłoszenia.
  - `--reason <text>`: wymagany powód zgłoszenia.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Polecenie właściciela do sprawdzania widoczności moderacyjnej pakietu.
- Wywołuje `GET /api/v1/packages/{name}/moderation`.
- Pokazuje bieżący stan skanowania pakietu, liczbę otwartych zgłoszeń, stan ręcznej
  moderacji najnowszego wydania, stan blokady pobierania oraz powody moderacji.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Sprawdza, czy pakiet jest gotowy do przyszłego użycia przez OpenClaw.
- Wywołuje `GET /api/v1/packages/{name}/readiness`.
- Zgłasza blokery dotyczące statusu oficjalnego, dostępności ClawPack, skrótu artefaktu,
  pochodzenia źródła, zgodności z OpenClaw, docelowych hostów, metadanych środowiska
  i stanu skanowania.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Pokazuje zorientowany na operatora status migracji pakietu, który może zastąpić
  dołączony Plugin OpenClaw.
- Wywołuje ten sam wyliczany punkt końcowy gotowości co `package readiness`, ale wypisuje
  status ukierunkowany na migrację, najnowszą wersję, stan oficjalnego pakietu, kontrole i
  blokery.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publikuje Plugin kodu lub Plugin pakietowy przez `POST /api/v1/packages`.
- `<source>` przyjmuje:
  - Ścieżka do folderu lokalnego: `./my-plugin`
  - Lokalny pakiet ClawPack w formacie tarball npm-pack: `./my-plugin-1.2.3.tgz`
  - Repozytorium GitHub: `owner/repo` lub `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadane są automatycznie wykrywane z `package.json`, `openclaw.plugin.json` i
  rzeczywistych znaczników pakietu OpenClaw, takich jak `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` i `.cursor-plugin/plugin.json`.
- Źródła `.tgz` są traktowane jako ClawPack. CLI przesyła dokładne bajty npm-pack
  i używa wyodrębnionej zawartości `package/` tylko do walidacji oraz wstępnego
  uzupełnienia metadanych.
- Foldery Pluginów kodu są pakowane do archiwum npm ClawPack przed przesłaniem, aby
  instalacje OpenClaw mogły zweryfikować dokładny artefakt. Foldery Pluginów pakietowych nadal
  używają ścieżki publikowania wyodrębnionych plików.
- Dla źródeł GitHub atrybucja źródła jest automatycznie uzupełniana na podstawie repozytorium, rozwiązanego commita, ref i podścieżki.
- Dla folderów lokalnych atrybucja źródła jest automatycznie wykrywana z lokalnego git, gdy zdalne `origin` wskazuje na GitHub.
- Zewnętrzne Pluginy kodu muszą jawnie deklarować `openclaw.compat.pluginApi` i
  `openclaw.build.openclawVersion`.
  `package.json.version` najwyższego poziomu nie jest używane jako wartość zastępcza w walidacji publikowania.
- `--dry-run` pokazuje podgląd rozwiązanego ładunku publikowania bez przesyłania.
- `--json` emituje dane wyjściowe czytelne maszynowo dla CI.
- `--owner <handle>` publikuje pod identyfikatorem wydawcy użytkownika lub organizacji, gdy aktor ma dostęp wydawcy.
- `--clawscan-note <text>` dodaje notatkę ClawScan. Ta notatka daje ClawScan
  kontekst dla zachowania, które w przeciwnym razie mogłoby wyglądać nietypowo, takiego jak dostęp do sieci,
  dostęp do natywnego hosta lub poświadczenia specyficzne dla dostawcy. Notatka jest przechowywana w
  opublikowanym wydaniu.
- Nazwy pakietów z zakresem muszą pasować do wybranego właściciela. Zobacz `docs/publishing.md`.
- Istniejące flagi (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) nadal działają jako nadpisania.
- Prywatne repozytoria GitHub wymagają `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Zalecany przepływ lokalny

Najpierw użyj `--dry-run`, aby potwierdzić rozwiązane metadane pakietu i
atrybucję źródła przed utworzeniem rzeczywistego wydania:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Przepływ folderu lokalnego

Dla Pluginów kodu publikowanie folderu buduje i przesyła artefakt ClawPack z
folderu pakietu:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimalny `package.json` dla `--family code-plugin`

Zewnętrzne Pluginy kodu potrzebują niewielkiej ilości metadanych OpenClaw w
`package.json`. Ten minimalny manifest wystarcza do pomyślnego publikowania:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Wymagane pola:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Uwagi:

- `package.json.version` to wersja wydania Twojego pakietu, ale nie jest używana jako
  wartość zastępcza dla walidacji zgodności/buildu OpenClaw.
- `openclaw.hostTargets` i `openclaw.environment` to opcjonalne metadane.
  ClawHub może je wyświetlać, gdy są obecne, ale nie są wymagane do publikowania.
- `openclaw.compat.minGatewayVersion` i
  `openclaw.build.pluginSdkVersion` to opcjonalne dodatki, jeśli chcesz opublikować
  bardziej szczegółowe metadane zgodności.
- Jeśli używasz starszego wydania CLI `clawhub`, zaktualizuj je przed publikowaniem, aby
  lokalne kontrole wstępne uruchomiły się przed przesłaniem.

#### GitHub Actions

ClawHub dostarcza również oficjalny workflow wielokrotnego użytku pod adresem
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
dla repozytoriów Pluginów.

Typowa konfiguracja wywołującego:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Uwagi:

- Workflow wielokrotnego użytku domyślnie ustawia `source` na repozytorium wywołującego.
- W przypadku monorepozytoriów przekaż `source_path`, aby workflow opublikował folder
  pakietu Pluginu, na przykład `source_path: extensions/codex`.
- Przypnij workflow wielokrotnego użytku do stabilnego tagu lub pełnego SHA commita. Nie uruchamiaj publikowania wydań z `@main`.
- `pull_request` powinien używać `dry_run: true`, aby CI nie zanieczyszczało stanu.
- Rzeczywiste publikacje powinny być ograniczone do zaufanych zdarzeń, takich jak `workflow_dispatch` lub wypchnięcia tagów.
- Zaufane publikowanie bez sekretu działa tylko przy `workflow_dispatch`; wypchnięcia tagów nadal potrzebują `clawhub_token`.
- Zachowaj `clawhub_token` dostępny dla pierwszej publikacji, niezaufanych pakietów lub awaryjnych publikacji.
- Workflow przesyła wynik JSON jako artefakt i udostępnia go jako dane wyjściowe workflow.

### `sync`

- Skanuje lokalne foldery Skills i publikuje nowe/zmienione.
- Katalogiem głównym może być dowolny folder: katalog Skills albo pojedynczy folder Skills z `SKILL.md`.
- Automatycznie dodaje katalogi główne Skills Clawdbot, gdy obecny jest `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (główny agent)
  - `routing.agents.*.workspace/skills` (dla każdego agenta)
  - `~/.clawdbot/skills` (współdzielone)
  - `skills.load.extraDirs` (współdzielone pakiety)
- Respektuje `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` oraz `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flagi:
  - `--root <dir...>` dodatkowe katalogi główne skanowania
  - `--all` przesyłanie bez pytania
  - `--dry-run` pokazuje tylko plan
  - `--bump patch|minor|major` (domyślnie: patch)
  - `--changelog <text>` (nieinteraktywnie)
  - `--tags a,b,c` (domyślnie: latest)
  - `--concurrency <n>` (domyślnie: 4)

Telemetria:

- Wysyłana podczas `sync` po zalogowaniu, chyba że ustawiono `CLAWHUB_DISABLE_TELEMETRY=1` (starsze `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Szczegóły: `docs/telemetry.md`.
