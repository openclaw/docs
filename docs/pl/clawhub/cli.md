---
read_when:
    - Korzystanie z CLI ClawHub
    - Debugowanie instalacji, aktualizacji, publikowania lub synchronizacji
summary: 'Dokumentacja referencyjna CLI: polecenia, flagi, konfiguracja, plik blokady, zachowanie synchronizacji.'
x-i18n:
    generated_at: "2026-05-12T04:09:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42231f76dee1ffc66585e72ce3d370658a362225ad858e7c72726f991287aa2
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pakiet CLI: `clawhub`, plik binarny: `clawhub`.

Zainstaluj go globalnie za pomocą npm albo pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Następnie go zweryfikuj:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flagi globalne

- `--workdir <dir>`: katalog roboczy (domyślnie: cwd; przechodzi awaryjnie na przestrzeń roboczą Clawdbot, jeśli jest skonfigurowana)
- `--dir <dir>`: katalog instalacji w katalogu roboczym (domyślnie: `skills`)
- `--site <url>`: bazowy URL do logowania w przeglądarce (domyślnie: `https://clawhub.ai`)
- `--registry <url>`: bazowy URL API (domyślnie: wykryty, w przeciwnym razie `https://clawhub.ai`)
- `--no-input`: wyłącz monity

Odpowiedniki env:

- `CLAWHUB_SITE` (starsze `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (starsze `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (starsze `CLAWDHUB_WORKDIR`)

### Proxy HTTP

CLI respektuje standardowe zmienne środowiskowe proxy HTTP w systemach za
proxy firmowymi lub w sieciach z ograniczeniami:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Gdy ustawiona jest dowolna z tych zmiennych, CLI kieruje żądania wychodzące przez
wskazany proxy. `HTTPS_PROXY` jest używane dla żądań HTTPS, a `HTTP_PROXY`
dla zwykłego HTTP. `NO_PROXY` / `no_proxy` jest respektowane, aby pominąć proxy dla
określonych hostów lub domen.

Jest to wymagane w systemach, w których bezpośrednie połączenia wychodzące są blokowane
(np. kontenery Docker, VPS Hetzner z internetem tylko przez proxy, firmowe
zapory sieciowe).

Przykład:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Gdy nie ustawiono żadnej zmiennej proxy, zachowanie pozostaje bez zmian (połączenia bezpośrednie).

## Plik konfiguracyjny

Przechowuje Twój token API oraz buforowany URL rejestru.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` albo `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Starszy fallback: jeśli `clawhub/config.json` jeszcze nie istnieje, ale istnieje `clawdhub/config.json`, CLI ponownie używa starszej ścieżki
- nadpisanie: `CLAWHUB_CONFIG_PATH` (starsze `CLAWDHUB_CONFIG_PATH`)

## Polecenia

### `login` / `auth login`

- Domyślnie: otwiera przeglądarkę pod adresem `<site>/cli/auth` i kończy przez callback local loopback.
- Headless: `clawhub login --token clh_...`
- Zdalnie/headless interaktywnie: `clawhub login --device` wypisuje kod i czeka, aż autoryzujesz go pod adresem `<site>/cli/device`.

### `whoami`

- Weryfikuje zapisany token przez `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Dodaje/usuwa skill z Twoich wyróżnień.
- Wywołuje `POST /api/v1/stars/<slug>` i `DELETE /api/v1/stars/<slug>`.
- `--yes` pomija potwierdzenie.

### `search <query...>`

- Wywołuje `/api/v1/search?q=...`.
- Wyszukiwanie preferuje dokładne dopasowania tokenów sluga/nazwy przed popularnością pobrań. Samodzielny token sluga, taki jak `map`, dopasowuje `personal-map` silniej niż podciąg w `amap`.
- Pobrania są niewielkim sygnałem popularności, a nie gwarancją najwyższej pozycji.
- Jeśli skill powinien się pojawić, ale się nie pojawia, uruchom `clawhub inspect <slug>` po zalogowaniu, aby sprawdzić diagnostykę moderacji widoczną dla właściciela przed zmianą nazwy metadanych.

### `explore`

- Wyświetla najnowsze Skills przez `/api/v1/skills?limit=...&sort=createdAt` (posortowane malejąco według `createdAt`).
- Flagi:
  - `--limit <n>` (1-200, domyślnie: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (domyślnie: newest)
  - `--json` (wynik czytelny maszynowo)
- Wynik: `<slug>  v<version>  <age>  <summary>` (podsumowanie skrócone do 50 znaków).

### `inspect <slug>`

- Pobiera metadane skill oraz pliki wersji bez instalowania.
- `--version <version>`: sprawdź określoną wersję (domyślnie: najnowsza).
- `--tag <tag>`: sprawdź oznaczoną wersję (np. `latest`).
- `--versions`: wypisz historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wyświetlenia (1-200).
- `--files`: wypisz pliki dla wybranej wersji.
- `--file <path>`: pobierz surową zawartość pliku (tylko pliki tekstowe; limit 200 KB).
- `--json`: wynik czytelny maszynowo.

### `install <slug>`

- Rozwiązuje najnowszą wersję przez `/api/v1/skills/<slug>`.
- Pobiera zip przez `/api/v1/download`.
- Wypakowuje do `<workdir>/<dir>/<slug>`.
- Odmawia nadpisania przypiętych Skills; najpierw uruchom `clawhub unpin <slug>`.
- Zapisuje:
  - `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

### `uninstall <slug>`

- Usuwa `<workdir>/<dir>/<slug>` i kasuje wpis w lockfile.
- Interaktywnie: prosi o potwierdzenie.
- Nieinteraktywnie (`--no-input`): wymaga `--yes`.

### `list`

- Odczytuje `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`).
- Wyświetla `pinned` obok Skills zamrożonych za pomocą `clawhub pin`, w tym opcjonalny powód.

### `pin <slug>`

- Oznacza zainstalowany element Skills jako przypięty w pliku blokady.
- `--reason <text>` zapisuje, dlaczego element Skills jest zamrożony.
- Przypięte Skills są pomijane przez `update --all` i odrzucane przez bezpośrednie `update <slug>`.
- Przypięte Skills odrzucają także `install --force`, aby lokalne bajty nie mogły zostać przypadkowo zastąpione.

### `unpin <slug>`

- Usuwa przypięcie z pliku blokady z zainstalowanego elementu Skills, aby przyszłe aktualizacje mogły go modyfikować.

### `update [slug]` / `update --all`

- Oblicza odcisk na podstawie plików lokalnych.
- Jeśli odcisk pasuje do znanej wersji: bez monitu.
- Jeśli odcisk nie pasuje:
  - domyślnie odmawia
  - nadpisuje z `--force` (lub po monicie, jeśli interaktywnie)
- Przypięte Skills nigdy nie są aktualizowane przez `--force`.
- `update <slug>` szybko kończy się niepowodzeniem dla przypiętych slugów i informuje, aby najpierw uruchomić `clawhub unpin <slug>`.
- `update --all` pomija przypięte slugi i drukuje podsumowanie tego, co pozostało zamrożone.

### `skill publish <path>`

- Publikuje przez `POST /api/v1/skills` (multipart).
- Wymaga wersjonowania semantycznego: `--version 1.2.3`.
- `--owner <handle>` publikuje pod identyfikatorem wydawcy organizacji/użytkownika, gdy
  wykonujący operację ma dostęp wydawcy.
- `--migrate-owner` przenosi istniejący element Skills do `--owner` podczas publikowania nowej
  wersji. Wymaga dostępu administratora/właściciela u obu wydawców.
- Zachowanie właściciela i przeglądu jest wyjaśnione w `docs/publishing.md`.
- Publikowanie elementu Skills oznacza, że jest on wydany na ClawHub na licencji `MIT-0`.
- Opublikowane Skills można swobodnie używać, modyfikować i redystrybuować bez przypisania autorstwa.
- ClawHub nie obsługuje płatnych Skills ani cen dla poszczególnych Skills.
- `--clawscan-note <text>` dodaje notatkę ClawScan. Ta notatka daje ClawScan
  kontekst dla zachowania, które w przeciwnym razie może wyglądać nietypowo, takiego jak dostęp do sieci,
  dostęp do natywnego hosta lub poświadczenia specyficzne dla dostawcy. Notatka jest przechowywana w
  opublikowanej wersji.
- Starszy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Miękko usuwa element Skills (właściciel, moderator lub administrator).
- Wywołuje `DELETE /api/v1/skills/{slug}`.
- Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni; polecenie drukuje czas wygaśnięcia.
- `--reason <text>` zapisuje notatkę moderacyjną przy elemencie Skills i w dzienniku audytu.
- `--note <text>` jest aliasem dla `--reason`.
- `--yes` pomija potwierdzenie.

### `undelete <slug>`

- Przywraca ukryty element Skills (właściciel, moderator lub administrator).
- Wywołuje `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` zapisuje notatkę moderacyjną przy elemencie Skills i w dzienniku audytu.
- `--note <text>` jest aliasem dla `--reason`.
- `--yes` pomija potwierdzenie.

### `hide <slug>`

- Ukrywa element Skills (właściciel, moderator lub administrator).
- Alias dla `delete`.

### `unhide <slug>`

- Odkrywa element Skills (właściciel, moderator lub administrator).
- Alias dla `undelete`.

### `skill rename <slug> <new-slug>`

- Zmienia nazwę posiadanego elementu Skills i zachowuje poprzedni slug jako alias przekierowania.
- Wywołuje `POST /api/v1/skills/{slug}/rename`.
- `--yes` pomija potwierdzenie.

### `skill merge <source-slug> <target-slug>`

- Scala jeden posiadany element Skills z innym posiadanym elementem Skills.
- Slug źródłowy przestaje być publicznie wyświetlany i staje się aliasem przekierowania do celu.
- Wywołuje `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pomija potwierdzenie.

### `transfer`

- Przepływ pracy przeniesienia własności.
- Przeniesienia do identyfikatorów użytkowników tworzą oczekującą prośbę, którą odbiorca akceptuje.
- Przeniesienia do identyfikatorów organizacji/wydawców są stosowane natychmiast tylko wtedy, gdy wykonujący operację ma
  dostęp administratora zarówno do obecnego właściciela, jak i wydawcy docelowego.
- Podpolecenia:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpointy:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Przegląda lub przeszukuje ujednolicony katalog pakietów przez `GET /api/v1/packages` i `GET /api/v1/packages/search`.
- Użyj tego dla Pluginów i innych wpisów z rodziny pakietów; `search` najwyższego poziomu pozostaje interfejsem wyszukiwania Skills.
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
- Użyj tego do metadanych Pluginu, zgodności, weryfikacji, źródła oraz sprawdzania wersji/plików.
- `--version <version>`: sprawdza określoną wersję (domyślnie: najnowsza).
- `--tag <tag>`: sprawdza wersję oznaczoną tagiem (np. `latest`).
- `--versions`: wyświetla historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wyświetlenia (1-100).
- `--files`: wyświetla pliki dla wybranej wersji.
- `--file <path>`: pobiera surową zawartość pliku (tylko pliki tekstowe; limit 200KB).
- `--json`: dane wyjściowe czytelne maszynowo.

### `package download <name>`

- Rozwiązuje wersję pakietu przez
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Pobiera artefakt z pola `downloadUrl` zwróconego przez mechanizm rozstrzygania.
- Weryfikuje SHA-256 ClawHub dla wszystkich artefaktów.
- Dla artefaktów ClawPack npm-pack weryfikuje także integralność npm `sha512`,
  shasum npm oraz nazwę/wersję w `package.json` archiwum tar.
- Starsze wersje ZIP są pobierane przez starszą ścieżkę ZIP.
- Flagi:
  - `--version <version>`: pobiera określoną wersję.
  - `--tag <tag>`: pobiera wersję oznaczoną tagiem (domyślnie: `latest`).
  - `-o, --output <path>`: plik lub katalog wyjściowy.
  - `--force`: nadpisuje istniejący plik wyjściowy.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykłady:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Oblicza SHA-256 ClawHub, integralność npm `sha512` i shasum npm dla lokalnego
  artefaktu.
- Z `--package` rozwiązuje oczekiwane metadane z ClawHub i porównuje
  plik lokalny z metadanymi opublikowanego artefaktu.
- Z bezpośrednimi flagami skrótu weryfikuje bez wyszukiwania w sieci.
- Flagi:
  - `--package <name>`: nazwa pakietu do rozwiązania oczekiwanych metadanych artefaktu.
  - `--version <version>` lub `--tag <tag>`: oczekiwana wersja pakietu.
  - `--sha256 <hex>`: oczekiwany SHA-256 ClawHub.
  - `--npm-integrity <sri>`: oczekiwana integralność npm.
  - `--npm-shasum <sha1>`: oczekiwany shasum npm.
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
- Wymaga dostępu administratora zarówno do obecnego właściciela pakietu, jak i docelowego
  wydawcy, chyba że operację wykonuje administrator platformy.
- Nazwy pakietów z zakresem muszą zostać przeniesione do właściciela pasującego zakresu.
- Wywołuje `POST /api/v1/packages/{name}/transfer`.
- Flagi:
  - `--to <owner>`: uchwyt docelowego wydawcy.
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
  dla moderatorów do przeglądu.
- Zgłoszenia same w sobie nie ukrywają automatycznie pakietów ani nie blokują pobrań.
- Flagi:
  - `--version <version>`: opcjonalna wersja pakietu do dołączenia do zgłoszenia.
  - `--reason <text>`: wymagany powód zgłoszenia.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Polecenie właściciela do sprawdzania widoczności moderacji pakietu.
- Wywołuje `GET /api/v1/packages/{name}/moderation`.
- Pokazuje bieżący stan skanowania pakietu, liczbę otwartych zgłoszeń, stan ręcznej moderacji najnowszego wydania,
  stan blokady pobierania oraz powody moderacji.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Sprawdza, czy pakiet jest gotowy do przyszłego użycia przez OpenClaw.
- Wywołuje `GET /api/v1/packages/{name}/readiness`.
- Zgłasza blokady dla statusu oficjalnego, dostępności ClawPack, skrótu artefaktu,
  pochodzenia źródła, kompatybilności OpenClaw, hostów docelowych, metadanych środowiska
  i stanu skanowania.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Pokazuje zorientowany na operatora stan migracji pakietu, który może zastąpić
  dołączony plugin OpenClaw.
- Wywołuje ten sam obliczany punkt końcowy gotowości co `package readiness`, ale wypisuje
  stan skoncentrowany na migracji, najnowszą wersję, stan oficjalnego pakietu, kontrole i
  blokady.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publikuje plugin kodu lub plugin pakietowy przez `POST /api/v1/packages`.
- `<source>` akceptuje:
  - Lokalna ścieżka folderu: `./my-plugin`
  - Lokalny archiwum tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Repozytorium GitHub: `owner/repo` lub `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadane są automatycznie wykrywane z `package.json`, `openclaw.plugin.json` i
  rzeczywistych markerów pakietu OpenClaw, takich jak `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` i `.cursor-plugin/plugin.json`.
- Źródła `.tgz` są traktowane jako ClawPack. CLI przesyła dokładne bajty npm-pack
  i używa wyodrębnionej zawartości `package/` tylko do walidacji oraz wstępnego wypełnienia
  metadanych.
- Foldery pluginów kodu są pakowane do archiwum tarball ClawPack npm przed przesłaniem, aby
  instalacje OpenClaw mogły zweryfikować dokładny artefakt. Foldery pluginów pakietowych nadal
  używają ścieżki publikowania wyodrębnionych plików.
- Dla źródeł GitHub atrybucja źródła jest automatycznie wypełniana na podstawie repozytorium, rozwiązanego commita, ref i podścieżki.
- Dla lokalnych folderów atrybucja źródła jest automatycznie wykrywana z lokalnego git, gdy zdalny origin wskazuje na GitHub.
- Zewnętrzne pluginy kodu muszą jawnie deklarować `openclaw.compat.pluginApi` i
  `openclaw.build.openclawVersion`.
  Najwyższego poziomu `package.json.version` nie jest używane jako wartość zapasowa dla walidacji publikowania.
- `--dry-run` pokazuje podgląd rozwiązanego ładunku publikowania bez przesyłania.
- `--json` emituje dane wyjściowe czytelne maszynowo dla CI.
- `--owner <handle>` publikuje pod uchwytem wydawcy użytkownika lub organizacji, gdy aktor ma dostęp wydawcy.
- `--clawscan-note <text>` dodaje notatkę ClawScan. Ta notatka daje ClawScan
  kontekst dla zachowania, które inaczej mogłoby wyglądać nietypowo, takiego jak dostęp do sieci,
  dostęp do natywnego hosta lub poświadczenia specyficzne dla providera. Notatka jest przechowywana w
  opublikowanym wydaniu.
- Nazwy pakietów z zakresem muszą pasować do wybranego właściciela. Zobacz `docs/publishing.md`.
- Istniejące flagi (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) nadal działają jako nadpisania.
- Prywatne repozytoria GitHub wymagają `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Zalecany lokalny przepływ

Najpierw użyj `--dry-run`, aby potwierdzić rozwiązane metadane pakietu i
atrybucję źródła przed utworzeniem rzeczywistego wydania:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Przepływ lokalnego folderu

Dla pluginów kodu publikowanie folderu buduje i przesyła artefakt ClawPack z
folderu pakietu:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimalny `package.json` dla `--family code-plugin`

Zewnętrzne pluginy kodu potrzebują niewielkiej ilości metadanych OpenClaw w
`package.json`. Ten minimalny manifest wystarczy do pomyślnego opublikowania:

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
  wartość zapasowa dla walidacji kompatybilności/budowania OpenClaw.
- `openclaw.hostTargets` i `openclaw.environment` to opcjonalne metadane.
  ClawHub może je pokazywać, gdy są obecne, ale nie są wymagane do publikacji.
- `openclaw.compat.minGatewayVersion` i
  `openclaw.build.pluginSdkVersion` to opcjonalne dodatki, jeśli chcesz opublikować
  bardziej szczegółowe metadane kompatybilności.
- Jeśli używasz starszego wydania CLI `clawhub`, zaktualizuj je przed publikowaniem, aby
  lokalne kontrole preflight działały przed przesłaniem.

#### GitHub Actions

ClawHub dostarcza także oficjalny wielokrotnego użytku workflow pod adresem
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/53b64d1d911106dab570eb6260e6ee977e9eefcd/.github/workflows/package-publish.yml)
dla repozytoriów pluginów.

Typowa konfiguracja wywołująca:

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

- Wielokrotnego użytku workflow domyślnie ustawia `source` na repozytorium wywołujące.
- Dla monorepozytoriów przekaż `source_path`, aby workflow publikował folder pakietu
  pluginu, na przykład `source_path: extensions/codex`.
- Przypnij wielokrotnego użytku workflow do stabilnego tagu lub pełnego SHA commita. Nie uruchamiaj publikowania wydań z `@main`.
- `pull_request` powinno używać `dry_run: true`, aby CI nie pozostawiało skutków ubocznych.
- Rzeczywiste publikacje powinny być ograniczone do zaufanych zdarzeń, takich jak `workflow_dispatch` lub wypchnięcia tagów.
- Zaufane publikowanie bez sekretu działa tylko na `workflow_dispatch`; wypchnięcia tagów nadal wymagają `clawhub_token`.
- Zachowaj dostępność `clawhub_token` dla pierwszej publikacji, niezaufanych pakietów lub awaryjnych publikacji.
- Workflow przesyła wynik JSON jako artefakt i udostępnia go jako dane wyjściowe workflow.

### `sync`

- Skanuje lokalne foldery Skills i publikuje nowe/zmienione.
- Katalogami głównymi mogą być dowolne foldery: katalog Skills albo pojedynczy folder Skills z `SKILL.md`.
- Automatycznie dodaje katalogi główne Skills Clawdbot, gdy obecny jest `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (główny agent)
  - `routing.agents.*.workspace/skills` (dla każdego agenta)
  - `~/.clawdbot/skills` (współdzielone)
  - `skills.load.extraDirs` (współdzielone paczki)
- Respektuje `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` i `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flagi:
  - `--root <dir...>` dodatkowe katalogi główne skanowania
  - `--all` przesyłaj bez pytania
  - `--dry-run` pokazuj tylko plan
  - `--bump patch|minor|major` (domyślnie: patch)
  - `--changelog <text>` (nieinteraktywne)
  - `--tags a,b,c` (domyślnie: latest)
  - `--concurrency <n>` (domyślnie: 4)

Telemetria:

- Wysyłana podczas `sync`, gdy użytkownik jest zalogowany, chyba że `CLAWHUB_DISABLE_TELEMETRY=1` (starsze `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Szczegóły: `docs/telemetry.md`.
