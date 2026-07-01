---
read_when:
    - Korzystanie z CLI ClawHub
    - Debugowanie instalacji, aktualizacji lub publikowania
summary: 'Dokumentacja CLI: polecenia, flagi, konfiguracja i zachowanie pliku blokady.'
x-i18n:
    generated_at: "2026-07-01T08:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pakiet CLI: `clawhub`, binarka: `clawhub`.

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

- `--workdir <dir>`: katalog roboczy (domyślnie: cwd; przechodzi awaryjnie na obszar roboczy Clawdbot, jeśli skonfigurowano)
- `--dir <dir>`: katalog instalacji pod workdir (domyślnie: `skills`)
- `--site <url>`: bazowy URL do logowania w przeglądarce (domyślnie: `https://clawhub.ai`)
- `--registry <url>`: bazowy URL API (domyślnie: wykryty, w przeciwnym razie `https://clawhub.ai`)
- `--no-input`: wyłącza monity

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

Przechowuje token API oraz zbuforowany URL rejestru.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Starsza ścieżka awaryjna: jeśli `clawhub/config.json` jeszcze nie istnieje, ale istnieje `clawdhub/config.json`, CLI ponownie użyje starszej ścieżki
- nadpisanie: `CLAWHUB_CONFIG_PATH` (starsze `CLAWDHUB_CONFIG_PATH`)

## Polecenia

### `login` / `auth login`

- Domyślnie: otwiera przeglądarkę pod adresem `<site>/cli/auth` i kończy przez callback loopback.
- Bez interfejsu graficznego: `clawhub login --token clh_...`
- Zdalnie/interaktywnie bez interfejsu graficznego: `clawhub login --device` wypisuje kod i czeka, aż autoryzujesz go pod adresem `<site>/cli/device`.

### `whoami`

- Weryfikuje zapisany token przez `/api/v1/whoami`.

### `token`

- Wypisuje zapisany token API na stdout.
- Przydatne do przekazywania lokalnego tokenu logowania do poleceń konfiguracji sekretów CI.

### `star <skill>` / `unstar <skill>`

- Dodaje/usuwa umiejętność z wyróżnionych.
- Wywołuje `POST /api/v1/stars/<slug>` i `DELETE /api/v1/stars/<slug>`.
- `--yes` pomija potwierdzenie.

### `search <query...>`

- Wywołuje `/api/v1/search?q=...`.
- Dane wyjściowe zawierają slug umiejętności, handle właściciela, nazwę wyświetlaną i wynik trafności.
- Wyszukiwanie preferuje dokładne dopasowania tokenów sluga/nazwy przed popularnością pobrań. Samodzielny token sluga, taki jak `map`, dopasowuje `personal-map` silniej niż podciąg wewnątrz `amap`.
- Popularność jest niewielkim wcześniejszym czynnikiem rankingowym, a nie gwarancją najwyższej pozycji.
- Jeśli umiejętność powinna się pojawić, ale się nie pojawia, uruchom `clawhub inspect @owner/slug` po zalogowaniu, aby sprawdzić widoczną dla właściciela diagnostykę moderacji przed zmianą nazw metadanych.

### `explore`

- Wyświetla najnowsze umiejętności przez `/api/v1/skills?limit=...&sort=createdAt` (sortowane malejąco według `createdAt`).
- Flagi:
  - `--limit <n>` (1-200, domyślnie: 25)
  - `--sort newest|updated|rating|downloads|trending` (domyślnie: newest). Starsze aliasy sortowania instalacji nadal działają dla kompatybilności.
  - `--json` (dane wyjściowe czytelne maszynowo)
- Dane wyjściowe: `<slug>  v<version>  <age>  <summary>` (podsumowanie obcięte do 50 znaków).

### `inspect @owner/slug`

- Pobiera metadane umiejętności i pliki wersji bez instalowania.
- `--version <version>`: sprawdza konkretną wersję (domyślnie: najnowszą).
- `--tag <tag>`: sprawdza wersję oznaczoną tagiem (np. `latest`).
- `--versions`: wyświetla historię wersji (pierwsza strona).
- `--limit <n>`: maksymalna liczba wersji do wyświetlenia (1-200).
- `--files`: wyświetla pliki dla wybranej wersji.
- `--file <path>`: pobiera surową zawartość pliku (tylko pliki tekstowe; limit 200 KB).
- `--json`: dane wyjściowe czytelne maszynowo.

### `install @owner/slug`

- Rozwiązuje najnowszą wersję dla wskazanego właściciela i umiejętności.
- Pobiera zip przez `/api/v1/download`.
- Rozpakowuje do `<workdir>/<dir>/<slug>`.
- Odmawia nadpisania przypiętych umiejętności; najpierw uruchom `clawhub unpin <skill>`.
- Zapisuje:
  - `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

### `uninstall <skill>`

- Usuwa `<workdir>/<dir>/<slug>` i usuwa wpis z pliku blokady.
- Wysyła telemetrię w trybie best-effort po zalogowaniu, aby bieżące liczniki instalacji mogły zostać
  dezaktywowane.
- Interaktywnie: pyta o potwierdzenie.
- Nieinteraktywnie (`--no-input`): wymaga `--yes`.

### `list`

- Odczytuje `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`).
- Pokazuje `pinned` obok umiejętności zamrożonych przez `clawhub pin`, w tym opcjonalny powód.

### `pin <skill>`

- Oznacza zainstalowaną umiejętność jako przypiętą w pliku blokady.
- `--reason <text>` zapisuje, dlaczego umiejętność jest zamrożona.
- Przypięte umiejętności są pomijane przez `update --all` i odrzucane przez bezpośrednie `update <skill>`.
- Przypięte umiejętności odrzucają także `install --force`, aby lokalne bajty nie zostały przypadkowo zastąpione.

### `unpin <skill>`

- Usuwa przypięcie z pliku blokady dla zainstalowanej umiejętności, aby przyszłe aktualizacje mogły ją modyfikować.

### `update [@owner/slug]` / `update --all`

- Oblicza fingerprint z lokalnych plików.
- Jeśli fingerprint pasuje do znanej wersji: brak monitu.
- Jeśli fingerprint nie pasuje:
  - domyślnie odmawia
  - nadpisuje z `--force` (lub po monicie, jeśli interaktywnie)
- Przypięte umiejętności nigdy nie są aktualizowane przez `--force`.
- `update <skill>` szybko kończy się błędem dla przypiętych umiejętności i informuje, aby najpierw uruchomić `clawhub unpin <skill>`.
- `update --all` pomija przypięte slugi i wypisuje podsumowanie tego, co pozostało zamrożone.

### `skill publish <path>`

- Porównuje fingerprint lokalnego pakietu z ClawHub i kończy się sukcesem, gdy
  zawartość jest już opublikowana.
- Nowe umiejętności domyślnie otrzymują `1.0.0`; zmienione umiejętności domyślnie otrzymują następną wersję
  patch.
- `--version <version>` jawnie wybiera wersję i publikuje nawet wtedy, gdy
  zawartość pasuje do istniejącej wersji.
- `--dry-run` rozwiązuje publikację bez przesyłania; `--json` wypisuje
  wynik czytelny maszynowo.
- `--owner <handle>` publikuje pod handlem wydawcy organizacji/użytkownika, gdy
  aktor ma dostęp wydawcy.
- `--migrate-owner` przenosi istniejącą umiejętność do `--owner` podczas publikowania nowej
  wersji. Wymaga dostępu administratora/właściciela u obu wydawców.
- Zachowanie właściciela i recenzji opisano w `docs/publishing.md`.
- Opublikowanie umiejętności oznacza, że jest ona wydana w ClawHub na licencji `MIT-0`.
- Opublikowane umiejętności można swobodnie używać, modyfikować i redystrybuować bez atrybucji.
- ClawHub nie obsługuje płatnych umiejętności ani cen za pojedynczą umiejętność.
- Starszy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Wielokrotnego użytku workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
wywołuje `skill publish` dla jednego `skill_path` albo dla każdego bezpośredniego folderu umiejętności
pod `root` (domyślnie: `skills`). Pomija niezmienione umiejętności i używa
tego samego automatycznego zachowania wersji patch.

Ustaw `dry_run: true`, aby podejrzeć bez tokenu. Rzeczywiste publikacje wymagają
sekretu `clawhub_token`.

### `sync`

- Skanuje bieżący workdir, skonfigurowany katalog umiejętności i wszystkie
  foldery `--root <dir>` pod kątem lokalnych folderów umiejętności zawierających `SKILL.md` lub
  `skill.md`.
- Porównuje fingerprint każdej lokalnej umiejętności z ClawHub i publikuje tylko nowe lub
  zmienione umiejętności.
- Nowe umiejętności są publikowane jako `1.0.0`; zmienione umiejętności domyślnie publikują następną wersję patch. Użyj `--bump minor|major` dla partii aktualizacji, które powinny przejść o
  większy krok semver.
- `--dry-run` pokazuje plan publikacji bez przesyłania; `--json` wypisuje
  plan czytelny maszynowo.
- `--all` publikuje każdą nową lub zmienioną umiejętność bez monitu. Bez
  `--all` terminale interaktywne pozwalają wybrać umiejętności do opublikowania.
- `--owner <handle>` publikuje pod handlem wydawcy organizacji/użytkownika, gdy
  aktor ma dostęp wydawcy.
- `sync` to wyłącznie jednokierunkowa publikacja. Nie instaluje, nie aktualizuje, nie pobiera ani nie
  raportuje telemetrii instalacji/pobrań.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Wymaga `clawhub login`.
- Uruchamia ClawHub ClawScan przez `POST /api/v1/skills/-/scan`, a następnie odpytuje, aż skan osiągnie stan końcowy.
- Skany są asynchroniczne i ich ukończenie może zająć trochę czasu. Podczas oczekiwania w kolejce spinner terminala pokazuje bieżącą priorytetową pozycję skanu oraz liczbę skanów przed nim.
- Opublikowane skany wymagają własności lub dostępu do zarządzania wydawcą. Moderatorzy/administratorzy mogą używać tego samego backendu przez `clawhub-admin`.
- `--update` jest prawidłowe tylko z `--slug`; zapisuje udane wyniki opublikowanego skanu z powrotem do wybranej wersji.
- `--output <file.zip>` pobiera pełne archiwum raportu z `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` i `README.md`.
- `--json` wypisuje pełną odpowiedź odpytywania dla automatyzacji.
- Skany lokalnych ścieżek nie są już obsługiwane. Prześlij nową wersję, a następnie użyj `scan download`, aby pobrać zapisane wyniki skanu dla tej zgłoszonej wersji.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Wymaga `clawhub login`.
- Pobiera zapisany raport skanu ZIP dla zgłoszonej wersji umiejętności lub pluginu, w tym wersji zablokowanych albo ukrytych przez kontrole bezpieczeństwa ClawHub.
- Pobrania umiejętności używają sluga umiejętności i domyślnie mają `--kind skill`.
- Pobrania Pluginów używają nazwy pakietu i wymagają `--kind plugin`.
- `--version` jest wymagane, aby autorzy sprawdzali dokładną zgłoszoną wersję zablokowaną przez ClawHub.
- `--output <file.zip>` wybiera ścieżkę docelową.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub dostarcza oficjalny workflow wielokrotnego użytku pod adresem
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
dla repozytoriów umiejętności i repozytoriów katalogów.

Typowa konfiguracja katalogu:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Uwagi:

- `root` domyślnie wskazuje `skills` dla repozytoriów katalogów.
- Przekaż `skill_path: skills/review-helper`, aby przetworzyć jeden folder umiejętności.
- `owner` mapuje się na flagę CLI `--owner`; pomiń go, aby publikować jako uwierzytelniony użytkownik.
- Publikowanie umiejętności V1 używa `clawhub_token`; zaufane publikowanie GitHub OIDC dotyczy na razie tylko pakietów.

### `delete <skill>`

- Bez `--version` miękko usuwa skill (właściciel, moderator lub administrator).
- Wywołuje `DELETE /api/v1/skills/{slug}`.
- Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni; polecenie wypisuje czas wygaśnięcia.
- `--version <version>` trwale usuwa jedną posiadaną wersję niebędącą najnowszą przez fail-closed,
  trasę specyficzną dla wersji.
  Usuniętych wersji nie można przywrócić ani opublikować ponownie. Opublikuj zamiennik przed usunięciem
  obecnej najnowszej wersji. Personel platformy nie omija własności w tym przepływie dotyczącym tylko wersji.
- `--reason <text>` zapisuje notatkę moderacyjną przy miękkim usunięciu całego skillu oraz w dzienniku audytu.
- `--note <text>` jest aliasem dla `--reason`.
- `--yes` pomija potwierdzenie.

### `undelete <skill>`

- Przywraca ukryty skill (właściciel, moderator lub administrator).
- Nie ma przywracania wersji; trwale usuniętych wersji nie można przywrócić.
- Wywołuje `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` zapisuje notatkę moderacyjną przy skillu oraz w dzienniku audytu.
- `--note <text>` jest aliasem dla `--reason`.
- `--yes` pomija potwierdzenie.

### `hide <skill>`

- Ukrywa skill (właściciel, moderator lub administrator).
- Alias dla `delete`.

### `unhide <skill>`

- Odkrywa skill (właściciel, moderator lub administrator).
- Alias dla `undelete`.

### `skill rename <skill> <new-name>`

- Zmienia nazwę posiadanego skillu i zachowuje poprzedni slug jako alias przekierowania.
- Wywołuje `POST /api/v1/skills/{slug}/rename`.
- `--yes` pomija potwierdzenie.

### `skill merge <source> <target>`

- Scala jeden posiadany skill z innym posiadanym skillem.
- Źródłowy slug przestaje być publicznie listowany i staje się aliasem przekierowania do celu.
- Wywołuje `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pomija potwierdzenie.

### `transfer`

- Przepływ przekazywania własności.
- Przeniesienia do uchwytów użytkowników tworzą oczekujące żądanie, które odbiorca akceptuje.
- Przeniesienia do uchwytów organizacji/wydawców są stosowane natychmiast tylko wtedy, gdy aktor ma
  dostęp administratora zarówno do obecnego właściciela, jak i docelowego wydawcy.
- Podpolecenia:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Punkty końcowe:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Przegląda lub przeszukuje ujednolicony katalog pakietów przez `GET /api/v1/packages` i `GET /api/v1/packages/search`.
- Używaj tego dla pluginów i innych wpisów z rodzin pakietów; najwyższego poziomu `search` pozostaje powierzchnią wyszukiwania skilli.
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
- Używaj tego do metadanych pluginów, zgodności, weryfikacji, źródła oraz inspekcji wersji/plików.
- `--version <version>`: sprawdź konkretną wersję (domyślnie: najnowszą).
- `--tag <tag>`: sprawdź wersję oznaczoną tagiem (np. `latest`).
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
  shasum npm oraz nazwę/wersję `package.json` w tarballu.
- Starsze wersje ZIP pobierają się przez starszą trasę ZIP.
- Flagi:
  - `--version <version>`: pobierz konkretną wersję.
  - `--tag <tag>`: pobierz wersję oznaczoną tagiem (domyślnie: `latest`).
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
- Z bezpośrednimi flagami skrótów weryfikuje bez wyszukiwania w sieci.
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

### `package validate <source>`

- Uruchamia dołączony do ClawHub CLI Plugin Inspector względem lokalnego folderu pakietu pluginu.
- Domyślnie używa walidacji offline/statycznej, bez lokalizowania ani importowania lokalnego
  checkoutu OpenClaw.
- Krytyczne błędy zgodności kończą działanie kodem niezerowym. Ustalenia będące tylko ostrzeżeniami są wypisywane, ale
  kończą działanie kodem zero.
- Flagi:
  - `--out <dir>`: zapisz raporty Plugin Inspector w tym katalogu.
  - `--openclaw <path>`: sprawdź względem jawnego lokalnego checkoutu OpenClaw.
  - `--runtime`: włącz przechwytywanie runtime; importuje kod pluginu.
  - `--allow-execute`: pozwól na przechwytywanie runtime w izolowanym obszarze roboczym.
  - `--no-mock-sdk`: wyłącz mockowane OpenClaw SDK podczas przechwytywania runtime.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package validate ./example-plugin
```

Jeśli walidacja zgłasza ustalenie dotyczące pakietu, manifestu, importu SDK lub artefaktu, zobacz
[Poprawki walidacji pluginów](/clawhub/plugin-validation-fixes), a następnie uruchom polecenie ponownie.

### `package delete <name>`

- Bez `--version` miękko usuwa pakiet i wszystkie wydania.
- `--version <version>` trwale usuwa jedno posiadane wydanie niebędące najnowszym przez fail-closed,
  trasę specyficzną dla wersji.
  Usuniętych wersji nie można przywrócić ani opublikować ponownie. Opublikuj zamiennik przed usunięciem
  obecnej najnowszej wersji. Ten przepływ dotyczący tylko wersji wymaga właściciela pakietu lub administratora wydawcy organizacyjnego; personel platformy nie omija własności pakietu.
- Miękkie usunięcie całego pakietu wymaga właściciela pakietu, właściciela/administratora wydawcy organizacyjnego, moderatora platformy
  lub administratora platformy.
- Flagi:
  - `--version <version>`: trwale usuń jedną wersję niebędącą najnowszą.
  - `--yes`: pomiń potwierdzenie.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Przywraca miękko usunięty pakiet i wydania.
- Nie ma przywracania wersji; trwale usuniętych wersji nie można przywrócić.
- Wymaga właściciela pakietu, właściciela/administratora wydawcy organizacyjnego, moderatora platformy
  lub administratora platformy.
- Wywołuje `POST /api/v1/packages/{name}/undelete`.
- Flagi:
  - `--yes`: pomiń potwierdzenie.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Przenosi pakiet do innego wydawcy.
- Wymaga dostępu administratora zarówno do obecnego właściciela pakietu, jak i docelowego
  wydawcy, chyba że wykonuje to administrator platformy.
- Nazwy pakietów z zakresem muszą zostać przeniesione do pasującego właściciela zakresu.
- Wywołuje `POST /api/v1/packages/{name}/transfer`.
- Flagi:
  - `--to <owner>`: uchwyt wydawcy docelowego.
  - `--reason <text>`: opcjonalny powód audytowy.
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Uwierzytelnione polecenie do zgłaszania pakietu moderatorom.
- Wywołuje `POST /api/v1/packages/{name}/report`.
- Zgłoszenia są na poziomie pakietu, opcjonalnie powiązane z wersją, i stają się widoczne
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

- Polecenie właściciela do sprawdzania widoczności moderacyjnej pakietu.
- Wywołuje `GET /api/v1/packages/{name}/moderation`.
- Pokazuje obecny stan skanowania pakietu, liczbę otwartych zgłoszeń, stan ręcznej
  moderacji najnowszego wydania, stan blokady pobierania oraz powody moderacji.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Sprawdza, czy pakiet jest gotowy do przyszłego wykorzystania przez OpenClaw.
- Wywołuje `GET /api/v1/packages/{name}/readiness`.
- Raportuje blokery statusu oficjalnego, dostępności ClawPack, skrótu artefaktu,
  pochodzenia źródła, zgodności z OpenClaw, celów hosta, metadanych środowiska
  oraz stanu skanowania.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Pokazuje status migracji ukierunkowany na operatora dla pakietu, który może zastąpić
  dołączony plugin OpenClaw.
- Wywołuje ten sam obliczany punkt końcowy gotowości co `package readiness`, ale wypisuje
  status skoncentrowany na migracji, najnowszą wersję, stan oficjalnego pakietu, kontrole i
  blokery.
- Flagi:
  - `--json`: dane wyjściowe czytelne maszynowo.

Przykład:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Tworzy wydawcę organizacyjnego należącego do uwierzytelnionego użytkownika.
- Uchwyt jest normalizowany do małych liter i może zostać przekazany z `@` lub bez.
- Nowo utworzeni wydawcy organizacyjni domyślnie nie są zaufani/oficjalni.
- Kończy się niepowodzeniem, jeśli uchwyt jest już używany przez istniejącego wydawcę, użytkownika lub zarezerwowaną trasę.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publikuje Plugin kodu lub Plugin pakietowy przez `POST /api/v1/packages`.
- `<source>` akceptuje:
  - Ścieżka do lokalnego folderu: `./my-plugin`
  - Lokalny tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Repozytorium GitHub: `owner/repo` lub `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Metadane są automatycznie wykrywane z `package.json`, `openclaw.plugin.json` oraz
  rzeczywistych znaczników pakietu OpenClaw, takich jak `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` i `.cursor-plugin/plugin.json`.
- Źródła `.tgz` są traktowane jako ClawPack. CLI przesyła dokładne bajty
  npm-pack i używa wyodrębnionej zawartości `package/` tylko do walidacji oraz
  wstępnego uzupełnienia metadanych.
- Foldery Pluginów kodu są pakowane do tarballa npm ClawPack przed przesłaniem,
  aby instalacje OpenClaw mogły zweryfikować dokładny artefakt. Foldery Pluginów
  pakietowych nadal używają ścieżki publikowania wyodrębnionych plików.
- Dla źródeł GitHub atrybucja źródła jest automatycznie uzupełniana z repozytorium, rozwiązanego commita, ref i podścieżki.
- Dla lokalnych folderów atrybucja źródła jest automatycznie wykrywana z lokalnego git, gdy zdalne origin wskazuje na GitHub.
- Zewnętrzne Pluginy kodu muszą jawnie deklarować `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
  Najwyższego poziomu `package.json.version` nie jest używane jako wartość zastępcza podczas walidacji publikowania.
- `--dry-run` pokazuje podgląd rozwiązanego ładunku publikowania bez przesyłania.
- `--json` emituje wyjście czytelne maszynowo dla CI.
- `--owner <handle>` publikuje pod uchwytem wydawcy użytkownika lub organizacji, gdy aktor ma dostęp wydawcy.
- Nazwy pakietów z zakresem muszą pasować do wybranego właściciela. Zobacz `docs/publishing.md`.
- Istniejące flagi (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) nadal działają jako nadpisania.
- Prywatne repozytoria GitHub wymagają `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Zalecany przepływ lokalny

Najpierw użyj `--dry-run`, aby potwierdzić rozwiązane metadane pakietu i
atrybucję źródła przed utworzeniem rzeczywistego wydania:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Przepływ dla lokalnego folderu

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

- `package.json.version` to wersja wydania Twojego pakietu, ale nie jest używana jako
  wartość zastępcza podczas walidacji zgodności/buildu OpenClaw.
- `openclaw.hostTargets` i `openclaw.environment` to opcjonalne metadane.
  ClawHub może je wyświetlać, gdy są obecne, ale nie są wymagane do publikacji.
- `openclaw.compat.minGatewayVersion` oraz
  `openclaw.build.pluginSdkVersion` to opcjonalne dodatki, jeśli chcesz opublikować
  bardziej szczegółowe metadane zgodności.
- Jeśli używasz starszego wydania CLI `clawhub`, zaktualizuj je przed publikacją, aby
  lokalne kontrole wstępne uruchamiały się przed przesłaniem.
- Jeśli walidacja zgłasza kod naprawczy, zobacz
  [Poprawki walidacji Pluginu](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub dostarcza także oficjalny workflow wielokrotnego użytku pod adresem
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
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
- W przypadku monorepo przekaż `source_path`, aby workflow opublikował folder
  pakietu Pluginu, na przykład `source_path: extensions/codex`.
- Przypnij workflow wielokrotnego użytku do stabilnego tagu lub pełnego SHA commita. Nie uruchamiaj publikowania wydania z `@main`.
- `pull_request` powinien używać `dry_run: true`, aby CI nie zanieczyszczało stanu.
- Rzeczywiste publikacje powinny być ograniczone do zaufanych zdarzeń, takich jak `workflow_dispatch` lub wypchnięcia tagów.
- Zaufane publikowanie bez sekretu działa tylko na `workflow_dispatch`; wypchnięcia tagów nadal wymagają `clawhub_token`.
- Zachowaj dostępność `clawhub_token` dla pierwszej publikacji, niezaufanych pakietów lub publikacji awaryjnych.
- Workflow przesyła wynik JSON jako artefakt i udostępnia go jako wyjścia workflow.

### `package trusted-publisher get <name>`

- Pokazuje konfigurację zaufanego wydawcy GitHub Actions dla pakietu.
- Użyj tego po ustawieniu konfiguracji, aby potwierdzić repozytorium, nazwę pliku workflow
  oraz opcjonalne przypięcie środowiska.
- Flagi:
  - `--json`: wyjście czytelne maszynowo.

Przykład:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Dołącza lub zastępuje konfigurację zaufanego wydawcy GitHub Actions dla istniejącego
  pakietu.
- Pakiet musi zostać najpierw utworzony przez zwykłe ręczne lub uwierzytelnione tokenem
  `clawhub package publish`.
- Po ustawieniu konfiguracji przyszłe obsługiwane publikacje GitHub Actions mogą używać
  OIDC/zaufanego publikowania bez długowiecznego tokenu ClawHub.
- `--repository <repo>` musi mieć postać `owner/repo`.
- `--workflow-filename <file>` musi pasować do nazwy pliku workflow w
  `.github/workflows/`.
- `--environment <name>` jest opcjonalne. Po skonfigurowaniu środowisko GitHub Actions
  w deklaracji OIDC musi pasować dokładnie.
- ClawHub weryfikuje skonfigurowane repozytorium GitHub podczas uruchamiania tego polecenia.
  Publiczne repozytoria można zweryfikować przez publiczne metadane GitHub. Prywatne
  repozytoria wymagają, aby ClawHub miał dostęp GitHub do tego repozytorium, na
  przykład przez przyszłą instalację GitHub App ClawHub lub inną autoryzowaną
  integrację GitHub.
- Flagi:
  - `--repository <repo>`: repozytorium GitHub, na przykład `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nazwa pliku workflow, na przykład `package-publish.yml`.
  - `--environment <name>`: opcjonalne środowisko GitHub Actions z dokładnym dopasowaniem.
  - `--json`: wyjście czytelne maszynowo.

Przykład:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Usuwa konfigurację zaufanego wydawcy z pakietu.
- Użyj tego jako wycofania zmian, jeśli workflow, repozytorium lub przypięcie środowiska musi
  zostać wyłączone albo utworzone ponownie.
- Przyszłe rzeczywiste publikacje muszą używać zwykłego uwierzytelnionego publikowania, dopóki konfiguracja
  nie zostanie ustawiona ponownie.
- Flagi:
  - `--json`: wyjście czytelne maszynowo.

Przykład:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetria instalacji

- Wysyłana po `clawhub install <slug>` po zalogowaniu, chyba że ustawiono
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- Raportowanie działa w trybie best-effort. Polecenia instalacji nie kończą się niepowodzeniem, jeśli telemetria jest
  niedostępna.
- Szczegóły: `docs/telemetry.md`.
