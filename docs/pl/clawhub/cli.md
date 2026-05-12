---
read_when:
    - Korzystanie z ClawHub CLI
    - Debugowanie instalacji, aktualizacji, publikowania lub synchronizacji
summary: 'Referencja CLI: polecenia, flagi, konfiguracja, plik blokady, zachowanie synchronizacji.'
x-i18n:
    generated_at: "2026-05-12T08:44:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pakiet CLI: `clawhub`, plik binarny: `clawhub`.

Zainstaluj go globalnie za pomocą npm lub pnpm:

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

- `--workdir <dir>`: katalog roboczy (domyślnie: cwd; wraca do obszaru roboczego Clawdbot, jeśli jest skonfigurowany)
- `--dir <dir>`: katalog instalacji w workdir (domyślnie: `skills`)
- `--site <url>`: bazowy URL do logowania w przeglądarce (domyślnie: `https://clawhub.ai`)
- `--registry <url>`: bazowy URL API (domyślnie: wykrywany, w przeciwnym razie `https://clawhub.ai`)
- `--no-input`: wyłącz monity

Odpowiedniki zmiennych środowiskowych:

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
wskazane proxy. `HTTPS_PROXY` jest używane dla żądań HTTPS, `HTTP_PROXY`
dla zwykłego HTTP. `NO_PROXY` / `no_proxy` jest respektowane, aby ominąć proxy dla
określonych hostów lub domen.

Jest to wymagane w systemach, w których bezpośrednie połączenia wychodzące są blokowane
(np. kontenery Docker, VPS Hetzner z internetem wyłącznie przez proxy, firmowe
zapory sieciowe).

Przykład:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Gdy nie ustawiono żadnej zmiennej proxy, zachowanie pozostaje bez zmian (połączenia bezpośrednie).

## Plik konfiguracji

Przechowuje token API + zapisany w pamięci podręcznej URL rejestru.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Starszy fallback: jeśli `clawhub/config.json` jeszcze nie istnieje, ale istnieje `clawdhub/config.json`, CLI ponownie używa starszej ścieżki
- nadpisanie: `CLAWHUB_CONFIG_PATH` (starsze `CLAWDHUB_CONFIG_PATH`)

## Polecenia

### `login` / `auth login`

- Domyślnie: otwiera przeglądarkę pod adresem `<site>/cli/auth` i kończy przez callback loopback.
- Headless: `clawhub login --token clh_...`
- Zdalnie/headless interaktywnie: `clawhub login --device` wypisuje kod i czeka, aż autoryzujesz go pod adresem `<site>/cli/device`.

### `whoami`

- Weryfikuje zapisany token przez `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Dodaje/usuwa skill z wyróżnionych.
- Wywołuje `POST /api/v1/stars/<slug>` i `DELETE /api/v1/stars/<slug>`.
- `--yes` pomija potwierdzenie.

### `search <query...>`

- Wywołuje `/api/v1/search?q=...`.
- Wyszukiwanie faworyzuje dokładne dopasowania tokenów sluga/nazwy przed popularnością pobrań. Samodzielny token sluga, taki jak `map`, dopasowuje `personal-map` silniej niż podciąg wewnątrz `amap`.
- Pobrania są niewielkim wstępnym sygnałem popularności, a nie gwarancją najwyższej pozycji.
- Jeśli skill powinien się pojawić, ale się nie pojawia, uruchom `clawhub inspect <slug>` po zalogowaniu, aby sprawdzić widoczną dla właściciela diagnostykę moderacji przed zmianą nazwy metadanych.

### `explore`

- Wyświetla najnowsze skills przez `/api/v1/skills?limit=...&sort=createdAt` (posortowane malejąco według `createdAt`).
- Flagi:
  - `--limit <n>` (1-200, domyślnie: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (domyślnie: newest)
  - `--json` (wynik czytelny maszynowo)
- Wynik: `<slug>  v<version>  <age>  <summary>` (summary skrócone do 50 znaków).

### `inspect <slug>`

- Pobiera metadane skill i pliki wersji bez instalowania.
- `--version <version>`: sprawdź konkretną wersję (domyślnie: najnowsza).
- `--tag <tag>`: sprawdź otagowaną wersję (np. `latest`).
- `--versions`: wyświetl historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wyświetlenia (1-200).
- `--files`: wyświetl pliki dla wybranej wersji.
- `--file <path>`: pobierz surową zawartość pliku (tylko pliki tekstowe; limit 200 KB).
- `--json`: wynik czytelny maszynowo.

### `install <slug>`

- Rozwiązuje najnowszą wersję przez `/api/v1/skills/<slug>`.
- Pobiera zip przez `/api/v1/download`.
- Wypakowuje do `<workdir>/<dir>/<slug>`.
- Odmawia nadpisania przypiętych skills; najpierw uruchom `clawhub unpin <slug>`.
- Zapisuje:
  - `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

### `uninstall <slug>`

- Usuwa `<workdir>/<dir>/<slug>` i usuwa wpis z lockfile.
- Interaktywnie: prosi o potwierdzenie.
- Nieinteraktywnie (`--no-input`): wymaga `--yes`.

### `list`

- Odczytuje `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`).
- Pokazuje `pinned` obok zamrożonych skills za pomocą `clawhub pin`, w tym opcjonalny powód.

### `pin <slug>`

- Oznacza zainstalowany skill jako przypięty w pliku blokady.
- `--reason <text>` zapisuje, dlaczego skill jest zamrożony.
- Przypięte skills są pomijane przez `update --all` i odrzucane przez bezpośrednie `update <slug>`.
- Przypięte skills odrzucają też `install --force`, aby lokalne bajty nie zostały przypadkowo zastąpione.

### `unpin <slug>`

- Usuwa przypięcie zainstalowanego skill z pliku blokady, aby przyszłe aktualizacje mogły go zmodyfikować.

### `update [slug]` / `update --all`

- Oblicza odcisk na podstawie lokalnych plików.
- Jeśli odcisk pasuje do znanej wersji: brak monitu.
- Jeśli odcisk nie pasuje:
  - domyślnie odmawia
  - nadpisuje z `--force` (lub po monicie, jeśli tryb interaktywny)
- Przypięte skills nigdy nie są aktualizowane przez `--force`.
- `update <slug>` szybko kończy się niepowodzeniem dla przypiętych slugów i informuje, aby najpierw uruchomić `clawhub unpin <slug>`.
- `update --all` pomija przypięte slugi i drukuje podsumowanie tego, co pozostało zamrożone.

### `skill publish <path>`

- Publikuje przez `POST /api/v1/skills` (multipart).
- Wymaga semver: `--version 1.2.3`.
- `--owner <handle>` publikuje pod uchwytem wydawcy organizacji/użytkownika, gdy
  aktor ma dostęp wydawcy.
- `--migrate-owner` przenosi istniejący skill do `--owner` podczas publikowania nowej
  wersji. Wymaga dostępu administratora/właściciela u obu wydawców.
- Zachowanie właściciela i recenzji wyjaśniono w `docs/publishing.md`.
- Opublikowanie skill oznacza, że zostaje wydany w ClawHub na licencji `MIT-0`.
- Opublikowane skills można swobodnie używać, modyfikować i rozpowszechniać bez przypisania autorstwa.
- ClawHub nie obsługuje płatnych skills ani cen dla pojedynczych skills.
- `--clawscan-note <text>` dodaje notatkę ClawScan. Ta notatka daje ClawScan
  kontekst dla zachowania, które inaczej może wyglądać nietypowo, takiego jak dostęp do sieci,
  dostęp do natywnego hosta lub poświadczenia specyficzne dla dostawcy. Notatka jest przechowywana w
  opublikowanej wersji.
- Starszy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Miękko usuwa skill (właściciel, moderator lub administrator).
- Wywołuje `DELETE /api/v1/skills/{slug}`.
- Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni; polecenie drukuje czas wygaśnięcia.
- `--reason <text>` zapisuje notatkę moderacyjną przy skill i w dzienniku audytu.
- `--note <text>` jest aliasem `--reason`.
- `--yes` pomija potwierdzenie.

### `undelete <slug>`

- Przywraca ukryty skill (właściciel, moderator lub administrator).
- Wywołuje `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` zapisuje notatkę moderacyjną przy skill i w dzienniku audytu.
- `--note <text>` jest aliasem `--reason`.
- `--yes` pomija potwierdzenie.

### `hide <slug>`

- Ukrywa skill (właściciel, moderator lub administrator).
- Alias dla `delete`.

### `unhide <slug>`

- Odkrywa skill (właściciel, moderator lub administrator).
- Alias dla `undelete`.

### `skill rename <slug> <new-slug>`

- Zmienia nazwę posiadanego skill i zachowuje poprzedni slug jako alias przekierowania.
- Wywołuje `POST /api/v1/skills/{slug}/rename`.
- `--yes` pomija potwierdzenie.

### `skill merge <source-slug> <target-slug>`

- Scala jeden posiadany skill z innym posiadanym skill.
- Slug źródłowy przestaje być publicznie wyświetlany i staje się aliasem przekierowania do docelowego.
- Wywołuje `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pomija potwierdzenie.

### `transfer`

- Przepływ przekazywania własności.
- Przekazania do uchwytów użytkowników tworzą oczekujące żądanie, które odbiorca akceptuje.
- Przekazania do uchwytów organizacji/wydawców stosują się natychmiast tylko wtedy, gdy aktor ma
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
- Użyj tego dla pluginów i innych wpisów z rodziny pakietów; najwyższego poziomu `search` pozostaje powierzchnią wyszukiwania skills.
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
- Użyj tego do sprawdzania metadanych pluginu, zgodności, weryfikacji, źródła oraz wersji/plików.
- `--version <version>`: sprawdź konkretną wersję (domyślnie: najnowsza).
- `--tag <tag>`: sprawdź oznaczoną wersję (np. `latest`).
- `--versions`: wypisz historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wypisania (1-100).
- `--files`: wypisz pliki dla wybranej wersji.
- `--file <path>`: pobierz surową zawartość pliku (tylko pliki tekstowe; limit 200 KB).
- `--json`: dane wyjściowe czytelne maszynowo.

### `package download <name>`

- Rozwiązuje wersję pakietu przez
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Pobiera artefakt z `downloadUrl` resolwera.
- Weryfikuje ClawHub SHA-256 dla wszystkich artefaktów.
- Dla artefaktów ClawPack npm-pack weryfikuje też integralność npm `sha512`,
  shasum npm oraz nazwę/wersję w `package.json` archiwum tar.
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

- Oblicza ClawHub SHA-256, integralność npm `sha512` oraz shasum npm dla lokalnego
  artefaktu.
- Z `--package` rozwiązuje oczekiwane metadane z ClawHub i porównuje
  lokalny plik z metadanymi opublikowanego artefaktu.
- Z bezpośrednimi flagami skrótów weryfikuje bez wyszukiwania sieciowego.
- Flagi:
  - `--package <name>`: nazwa pakietu do rozwiązania oczekiwanych metadanych artefaktu.
  - `--version <version>` lub `--tag <tag>`: oczekiwana wersja pakietu.
  - `--sha256 <hex>`: oczekiwany ClawHub SHA-256.
  - `--npm-integrity <sri>`: oczekiwana integralność npm.
  - `--npm-shasum <sha1>`: oczekiwany shasum npm.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykłady:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Usuwa logicznie pakiet i wszystkie wydania.
- Wymaga właściciela pakietu, właściciela/administratora wydawcy organizacji, moderatora platformy
  albo administratora platformy.
- Flagi:
  - `--yes`: pomija potwierdzenie.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Przywraca logicznie usunięty pakiet i wydania.
- Wymaga właściciela pakietu, właściciela/administratora wydawcy organizacji, moderatora platformy
  albo administratora platformy.
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
  dla moderatorów do sprawdzenia.
- Zgłoszenia same z siebie nie ukrywają automatycznie pakietów ani nie blokują pobrań.
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
- Zgłasza blokady dotyczące oficjalnego statusu, dostępności ClawPack, skrótu artefaktu,
  pochodzenia źródła, zgodności z OpenClaw, docelowych hostów, metadanych środowiska
  i stanu skanowania.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Pokazuje zorientowany na operatora stan migracji pakietu, który może zastąpić
  dołączony Plugin OpenClaw.
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

- Publikuje Plugin kodu albo Plugin pakietu przez `POST /api/v1/packages`.
- `<source>` akceptuje:
  - Ścieżka folderu lokalnego: `./my-plugin`
  - Lokalny tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` lub `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadane są wykrywane automatycznie z `package.json`, `openclaw.plugin.json` oraz
  rzeczywistych znaczników pakietów OpenClaw, takich jak `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` i `.cursor-plugin/plugin.json`.
- Źródła `.tgz` są traktowane jako ClawPack. CLI przesyła dokładne bajty npm-pack
  i używa wyodrębnionej zawartości `package/` tylko do walidacji oraz wstępnego
  uzupełnienia metadanych.
- Foldery Pluginów kodu są pakowane do tarballa npm ClawPack przed przesłaniem, aby
  instalacje OpenClaw mogły zweryfikować dokładny artefakt. Foldery Pluginów pakietów nadal
  używają ścieżki publikowania wyodrębnionych plików.
- Dla źródeł GitHub przypisanie źródła jest automatycznie uzupełniane na podstawie repozytorium, rozwiązanego commita, ref i podścieżki.
- Dla folderów lokalnych przypisanie źródła jest automatycznie wykrywane z lokalnego git, gdy zdalny origin wskazuje na GitHub.
- Zewnętrzne Pluginy kodu muszą jawnie deklarować `openclaw.compat.pluginApi` i
  `openclaw.build.openclawVersion`.
  `package.json.version` najwyższego poziomu nie jest używane jako wartość zastępcza do walidacji publikacji.
- `--dry-run` wyświetla podgląd rozwiązanego ładunku publikacji bez przesyłania.
- `--json` emituje dane wyjściowe czytelne maszynowo dla CI.
- `--owner <handle>` publikuje pod uchwytem wydawcy użytkownika lub organizacji, gdy aktor ma dostęp wydawcy.
- `--clawscan-note <text>` dodaje notatkę ClawScan. Ta notatka daje ClawScan
  kontekst dla zachowania, które w przeciwnym razie może wyglądać nietypowo, takiego jak dostęp do sieci,
  dostęp do natywnego hosta albo poświadczenia specyficzne dla dostawcy. Notatka jest przechowywana w
  opublikowanym wydaniu.
- Nazwy pakietów z zakresem muszą pasować do wybranego właściciela. Zobacz `docs/publishing.md`.
- Istniejące flagi (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) nadal działają jako nadpisania.
- Prywatne repozytoria GitHub wymagają `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Zalecany przepływ lokalny

Najpierw użyj `--dry-run`, aby potwierdzić rozwiązane metadane pakietu i
przypisanie źródła przed utworzeniem wydania na żywo:

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
`package.json`. Ten minimalny manifest wystarczy do udanej publikacji:

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

- `package.json.version` jest wersją wydania Twojego pakietu, ale nie jest używana jako
  wartość zastępcza do walidacji zgodności/budowania OpenClaw.
- `openclaw.hostTargets` i `openclaw.environment` są opcjonalnymi metadanymi.
  ClawHub może je pokazywać, gdy są obecne, ale nie są wymagane do publikacji.
- `openclaw.compat.minGatewayVersion` i
  `openclaw.build.pluginSdkVersion` są opcjonalnymi dodatkami, jeśli chcesz opublikować
  bardziej szczegółowe metadane zgodności.
- Jeśli używasz starszego wydania CLI `clawhub`, zaktualizuj je przed publikacją, aby
  lokalne kontrole wstępne uruchomiły się przed przesłaniem.

#### GitHub Actions

ClawHub dostarcza też oficjalny workflow wielokrotnego użytku pod adresem
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
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
- W przypadku monorepo przekaż `source_path`, aby workflow opublikował folder pakietu Plugin,
  na przykład `source_path: extensions/codex`.
- Przypnij workflow wielokrotnego użytku do stabilnego tagu albo pełnego SHA commita. Nie uruchamiaj publikowania wydań z `@main`.
- `pull_request` powinien używać `dry_run: true`, aby CI nie zanieczyszczało stanu.
- Rzeczywiste publikacje powinny być ograniczone do zaufanych zdarzeń, takich jak `workflow_dispatch` albo wypchnięcia tagów.
- Zaufane publikowanie bez sekretu działa tylko na `workflow_dispatch`; wypchnięcia tagów nadal wymagają `clawhub_token`.
- Zachowaj dostępność `clawhub_token` na potrzeby pierwszej publikacji, niezaufanych pakietów albo awaryjnych publikacji.
- Workflow przesyła wynik JSON jako artefakt i udostępnia go jako dane wyjściowe workflow.

### `sync`

- Skanuje lokalne foldery Skills i publikuje nowe/zmienione.
- Katalogami głównymi mogą być dowolne foldery: katalog skills albo pojedynczy folder skill z `SKILL.md`.
- Automatycznie dodaje katalogi główne skill Clawdbot, gdy obecny jest `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (główny agent)
  - `routing.agents.*.workspace/skills` (dla każdego agenta)
  - `~/.clawdbot/skills` (współdzielone)
  - `skills.load.extraDirs` (współdzielone pakiety)
- Respektuje `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` oraz `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flagi:
  - `--root <dir...>` dodatkowe katalogi główne skanowania
  - `--all` przesyłaj bez pytania
  - `--dry-run` pokaż tylko plan
  - `--bump patch|minor|major` (domyślnie: patch)
  - `--changelog <text>` (nieinteraktywnie)
  - `--tags a,b,c` (domyślnie: latest)
  - `--concurrency <n>` (domyślnie: 4)

Telemetria:

- Wysyłana podczas `sync`, gdy użytkownik jest zalogowany, chyba że ustawiono `CLAWHUB_DISABLE_TELEMETRY=1` (starsze `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Szczegóły: `docs/telemetry.md`.
