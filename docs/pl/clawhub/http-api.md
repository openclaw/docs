---
read_when:
    - Dodawanie/modyfikowanie punktów końcowych
    - Debugowanie żądań CLI ↔ rejestr
summary: Dokumentacja referencyjna API HTTP (publiczne punkty końcowe + punkty końcowe CLI + uwierzytelnianie).
x-i18n:
    generated_at: "2026-05-11T22:19:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

Bazowy URL: `https://clawhub.ai` (domyślnie).

Wszystkie ścieżki v1 znajdują się pod `/api/v1/...`.
Starsze `/api/...` i `/api/cli/...` pozostają ze względu na zgodność (zobacz `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Ponowne użycie katalogu publicznego

Katalogi firm trzecich mogą używać publicznych punktów końcowych odczytu do listowania lub wyszukiwania Skills ClawHub. Buforuj wyniki, respektuj `429`/`Retry-After`, odsyłaj użytkowników do kanonicznej pozycji ClawHub (`https://clawhub.ai/<owner>/<slug>`) i unikaj sugerowania, że ClawHub popiera witrynę firmy trzeciej. Nie próbuj kopiować ukrytych, prywatnych ani zablokowanych przez moderację treści poza publiczną powierzchnię API.

Skróty slugów w sieci Web są rozwiązywane między rodzinami rejestru, ale klienci API powinni używać
kanonicznych URL-i zwracanych przez punkty końcowe odczytu zamiast rekonstruować kolejność
tras.

## Limity szybkości

Model egzekwowania:

- Żądania anonimowe: egzekwowane według IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): egzekwowane według koszyka użytkownika.
- Jeśli tokenu brakuje albo jest nieprawidłowy, zachowanie wraca do egzekwowania według IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać gołego `Unauthorized`, gdy
  serwer zna przyczynę. Brakujące tokeny, nieprawidłowe/cofnięte tokeny oraz
  usunięte/zbanowane/wyłączone konta powinny dostać możliwy do działania tekst, aby klienci
  CLI mogli powiedzieć użytkownikom, co ich zablokowało.

- Odczyt: 600/min na IP, 2400/min na klucz
- Zapis: 45/min na IP, 180/min na klucz
- Pobieranie: 30/min na IP, 180/min na klucz (`/api/v1/download`)

Nagłówki:

- Zgodność ze starszą wersją: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Ustandaryzowane: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Przy `429`: `Retry-After`

Semantyka nagłówków:

- `X-RateLimit-Reset`: bezwzględne sekundy epoki Unix
- `RateLimit-Reset`: sekundy do resetu (opóźnienie)
- `Retry-After`: sekundy oczekiwania przed ponowną próbą (opóźnienie) przy `429`

Przykładowa odpowiedź `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Wytyczne dla klienta:

- Jeśli istnieje `Retry-After`, poczekaj tyle sekund przed ponowną próbą.
- Używaj backoffu z jitterem, aby uniknąć zsynchronizowanych ponownych prób.
- Jeśli brakuje `Retry-After`, użyj awaryjnie `RateLimit-Reset` (albo oblicz z `X-RateLimit-Reset`).

Źródło IP:

- Domyślnie używa `cf-connecting-ip` (Cloudflare) jako IP klienta.
- ClawHub używa zaufanych nagłówków przekazywania, aby identyfikować IP klientów na krawędzi.
- Jeśli zaufany IP klienta nie jest dostępny, anonimowe żądania pobierania używają koszyka awaryjnego o zakresie punktu końcowego zamiast jednego globalnego koszyka `ip:unknown`. Anonimowe żądania odczytu/zapisu nadal używają współdzielonego koszyka nieznanego, aby routing z brakującym IP pozostawał widoczny i konserwatywny.

## Publiczne punkty końcowe (bez uwierzytelniania)

### `GET /api/v1/search`

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita
- `highlightedOnly` (opcjonalne): `true`, aby filtrować do wyróżnionych Skills
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalne): starszy alias dla `nonSuspiciousOnly`

Odpowiedź:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

Uwagi:

- Wyniki są zwracane w kolejności trafności (podobieństwo osadzeń + wzmocnienia dokładnych tokenów sluga/nazwy + wcześniejsza popularność z pobrań).
- Trafność jest silniejsza niż popularność. Precyzyjne dopasowanie tokenu sluga lub nazwy wyświetlanej może wyprzedzić luźniejsze dopasowanie z dużo większą liczbą pobrań.
- Tekst ASCII jest tokenizowany na granicach słów i znaków interpunkcyjnych. Na przykład `personal-map` zawiera samodzielny token `map`, podczas gdy `amap-jsapi-skill` zawiera `amap`, `jsapi` i `skill`; wyszukiwanie `map` daje więc `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Pobrania są używane jako mały, logarytmicznie skalowany czynnik wcześniejszy i rozstrzygający remisy, a nie jako główny sygnał rankingu. Skills z dużą liczbą pobrań mogą zajmować niższe miejsca, gdy tekst zapytania jest słabszym dopasowaniem.
- Podejrzany lub ukryty stan moderacji może usunąć Skill z publicznego wyszukiwania w zależności od filtrów wywołującego i bieżącego statusu moderacji.

Wytyczne wykrywalności dla wydawcy:

- Umieść terminy, których użytkownicy będą dosłownie szukać, w nazwie wyświetlanej, podsumowaniu i tagach. Używaj samodzielnego tokenu sluga tylko wtedy, gdy jest też stabilną tożsamością, którą chcesz zachować.
- Nie zmieniaj sluga tylko po to, aby gonić jedno zapytanie, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny URL, wyświetlany slug i przyszłe skróty wyszukiwania używają nowego sluga.
- Aliasy zmiany nazwy zachowują rozwiązywanie dla starych URL-i i instalacji, które rozwiązywane są przez rejestr, ale ranking wyszukiwania opiera się na kanonicznych metadanych Skill po zaindeksowaniu zmiany nazwy. Istniejące statystyki pozostają przy Skill.
- Jeśli Skill jest nieoczekiwanie niewidoczny, najpierw sprawdź stan moderacji za pomocą `clawhub inspect <slug>` po zalogowaniu, zanim zmienisz metadane związane z rankingiem.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–200)
- `cursor` (opcjonalne): kursor paginacji dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalne): `updated` (domyślnie), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalne): starszy alias dla `nonSuspiciousOnly`

Uwagi:

- `trending` szereguje według instalacji z ostatnich 7 dni (na podstawie telemetrii).
- `createdAt` jest stabilne dla indeksowania nowych Skills; `updated` zmienia się, gdy istniejące Skills są publikowane ponownie.
- Gdy `nonSuspiciousOnly=true`, sortowania oparte na kursorze mogą zwracać na stronie mniej elementów niż `limit`, ponieważ podejrzane Skills są filtrowane po pobraniu strony.
- Użyj `nextCursor`, aby kontynuować paginację, gdy jest obecny. Krótka strona sama w sobie nie oznacza końca wyników.

Odpowiedź:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Odpowiedź:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Uwagi:

- Stare slugi utworzone przez przepływy zmiany nazwy/scalenia właściciela rozwiązywane są do kanonicznego Skill.
- `metadata.os`: ograniczenia systemu operacyjnego zadeklarowane we frontmatter Skill (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata.systems`: cele systemowe Nix (np. `["aarch64-darwin", "x86_64-linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata` ma wartość `null`, jeśli Skill nie ma metadanych platformy.
- `moderation` jest uwzględniane tylko wtedy, gdy Skill jest oznaczony lub widzi go właściciel.

### `GET /api/v1/skills/{slug}/moderation`

Zwraca ustrukturyzowany stan moderacji.

Odpowiedź:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Uwagi:

- Właściciele i moderatorzy mogą uzyskać dostęp do szczegółów moderacji ukrytych Skills.
- Publiczni wywołujący dostają `200` tylko dla już oznaczonych widocznych Skills.
- Dowody są redagowane dla publicznych wywołujących i zawierają surowe fragmenty tylko dla właścicieli/moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłoś Skill do przeglądu przez moderatora. Zgłoszenia są na poziomie Skill, opcjonalnie powiązane
z wersją, i zasilają kolejkę zgłoszeń Skills.

Uwierzytelnianie:

- Wymaga tokenu API.

Żądanie:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Odpowiedź:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Punkt końcowy moderatora/administratora do przyjmowania zgłoszeń Skills.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `confirmed`, `dismissed` albo `all`
- `limit` (opcjonalne): liczba całkowita (1-200)
- `cursor` (opcjonalne): kursor paginacji

Odpowiedź:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Punkt końcowy moderatora/administratora do rozwiązywania lub ponownego otwierania zgłoszeń Skills.

Żądanie:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` jest wymagane dla `confirmed` i `dismissed`; może zostać pominięte przy
ustawianiu `status` z powrotem na `open`. Przekaż `finalAction: "hide"` z ocenionym
zgłoszeniem, aby ukryć Skill w tym samym audytowalnym przepływie pracy.

### `GET /api/v1/skills/{slug}/versions`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita
- `cursor` (opcjonalne): kursor paginacji

### `GET /api/v1/skills/{slug}/versions/{version}`

Zwraca metadane wersji + listę plików.

- `version.security` zawiera znormalizowany status weryfikacji skanowania i szczegóły skanera
  (VirusTotal + LLM), gdy są dostępne.

### `GET /api/v1/skills/{slug}/scan`

Zwraca szczegóły weryfikacji skanowania bezpieczeństwa dla wersji Skill.

Parametry zapytania:

- `version` (opcjonalne): konkretny ciąg wersji.
- `tag` (opcjonalne): rozwiąż otagowaną wersję (na przykład `latest`).

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używa najnowszej wersji.
- Zawiera znormalizowany status weryfikacji oraz szczegóły specyficzne dla skanera.
- `security.capabilityTags` zawiera deterministyczne etykiety możliwości/ryzyka, takie jak
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` i `posts-externally`, gdy zostaną wykryte.
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wygenerował definitywny werdykt (`clean`, `suspicious` albo `malicious`).
- `moderation` jest bieżącą migawką moderacji na poziomie Skill pochodzącą z najnowszej wersji.
- Przy zapytaniu o wersję historyczną sprawdź `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim potraktujesz `moderation` i `security` jako ten sam kontekst wersji.

### `GET /api/v1/skills/{slug}/file`

Zwraca surową zawartość tekstową.

Parametry zapytania:

- `path` (wymagane)
- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszej wersji.
- Limit rozmiaru pliku: 200 KB.

### `GET /api/v1/packages`

Ujednolicony punkt końcowy katalogu dla:

- Skills
- Pluginy kodu
- Pluginy pakietowe

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–100)
- `cursor` (opcjonalne): kursor paginacji
- `family` (opcjonalne): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalne): `official`, `community` lub `private`
- `isOfficial` (opcjonalne): `true` lub `false`
- `executesCode` (opcjonalne): `true` lub `false`
- `capabilityTag` (opcjonalne): filtr możliwości dla pakietów Plugin
- `target` / `hostTarget` (opcjonalne): skrót dla `host:<target>`
- `os`, `arch`, `libc` (opcjonalne): skrót dla filtrów możliwości hosta
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opcjonalne): skrót `true`/`1` dla tagów wymagań środowiskowych
- `externalService`, `binary`, `osPermission` (opcjonalne): skrót dla nazwanych
  tagów wymagań środowiskowych
- `artifactKind` (opcjonalne): `legacy-zip` lub `npm-pack`
- `npmMirror` (opcjonalne): `true`/`1`, aby pokazać wersje pakietów opartych na ClawPack
  dostępne przez lustro npm

Uwagi:

- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami stałej rodziny.
- Wpisy Skills nadal są oparte na rejestrze Skills i nadal mogą być publikowane tylko przez `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy tylko do wydań `code-plugin` i `bundle-plugin`.
- Wywołujący anonimowi widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą widzieć prywatne pakiety wydawców, do których należą, w wynikach listy/wyszukiwania.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie katalogu w Skills i pakietach Plugin.

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita (1–100)
- `family` (opcjonalne): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalne): `official`, `community` lub `private`
- `isOfficial` (opcjonalne): `true` lub `false`
- `executesCode` (opcjonalne): `true` lub `false`
- `capabilityTag` (opcjonalne): filtr możliwości dla pakietów Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` i
  `osPermission` są akceptowane jako skróty dla typowych tagów możliwości
- `artifactKind` (opcjonalne): `legacy-zip` lub `npm-pack`
- `npmMirror` (opcjonalne): `true`/`1`, aby wyszukiwać wersje pakietów opartych na ClawPack
  dostępne przez lustro npm

Uwagi:

- Wywołujący anonimowi widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.
- Filtry artefaktów są oparte na indeksowanych tagach możliwości:
  `artifact:legacy-zip`, `artifact:npm-pack` i `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Zwraca metadane szczegółów pakietu.

Uwagi:

- Skills można też rozwiązywać przez tę trasę w ujednoliconym katalogu.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela-wydawcę.

### `DELETE /api/v1/packages/{name}`

Oznacza pakiet i wszystkie wydania jako miękko usunięte.

Uwagi:

- Wymaga tokenu API właściciela pakietu, właściciela/administratora wydawcy organizacji,
  moderatora platformy lub administratora platformy.

### `GET /api/v1/packages/{name}/versions`

Zwraca historię wersji.

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–100)
- `cursor` (opcjonalne): kursor paginacji

Uwagi:

- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela-wydawcę.

### `GET /api/v1/packages/{name}/versions/{version}`

Zwraca jedną wersję pakietu, w tym metadane plików, zgodność,
możliwości, weryfikację, metadane artefaktu i dane skanowania.

Uwagi:

- `version.artifact.kind` ma wartość `legacy-zip` dla archiwów pakietów starego typu lub
  `npm-pack` dla wydań opartych na ClawPack.
- Wydania ClawPack zawierają pola zgodne z npm: `npmIntegrity`, `npmShasum` i
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` i `version.staticScan` są uwzględniane, gdy istnieją dane skanowania.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela-wydawcę.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane resolwera artefaktu dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` i starszy adres ZIP
  `downloadUrl`.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm, adres
  `tarballUrl` i adres zgodności ze starszym ZIP.
- To jest powierzchnia resolwera OpenClaw; unika zgadywania formatu archiwum na podstawie
  współdzielonego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji przez jawną ścieżkę resolwera.

Uwagi:

- Wersje ClawPack strumieniują dokładnie przesłane bajty `.tgz` z `npm-pack`.
- Starsze wersje ZIP przekierowują do `/api/v1/packages/{name}/download?version=`.
- Używa limitu szybkości pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczoną gotowość do przyszłego użycia przez OpenClaw.

Sprawdzenia gotowości obejmują:

- status kanału oficjalnego
- dostępność najnowszej wersji
- dostępność artefaktu ClawPack `npm-pack`
- skrót artefaktu
- repozytorium źródłowe i pochodzenie commita
- metadane zgodności z OpenClaw
- cele hosta
- stan skanowania

Odpowiedź:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Punkt końcowy moderatora do wyświetlania wierszy migracji oficjalnych Plugin OpenClaw.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `phase` (opcjonalne): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` lub
  `all` (domyślnie).
- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji

Odpowiedź:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Punkt końcowy administratora do tworzenia lub aktualizowania wiersza migracji oficjalnego Plugin.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego administratorem.

Treść żądania:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Uwagi:

- `bundledPluginId` jest normalizowane do małych liter i jest stabilnym kluczem upsert.
- `packageName` jest normalizowane jako nazwa npm; pakiet może brakować w przypadku planowanych
  migracji.
- To śledzi tylko gotowość migracji. Nie modyfikuje OpenClaw ani nie generuje
  ClawPacków.

### `GET /api/v1/packages/moderation/queue`

Punkt końcowy moderatora/administratora dla kolejek przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `blocked`, `manual` lub `all`
- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji

Znaczenia statusów:

- `open`: podejrzane, złośliwe, oczekujące, objęte kwarantanną, unieważnione lub zgłoszone wydania.
- `blocked`: objęte kwarantanną, unieważnione lub złośliwe wydania.
- `manual`: dowolne wydanie z ręcznym nadpisaniem moderacji.
- `all`: dowolne wydanie z ręcznym nadpisaniem, nieczystym stanem skanowania lub zgłoszeniem pakietu.

Odpowiedź:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Zgłasza pakiet do przeglądu moderatora. Zgłoszenia są na poziomie pakietu, opcjonalnie
powiązane z wersją. Zasilają kolejkę moderacji, ale same nie ukrywają automatycznie ani
nie blokują pobrań; moderatorzy powinni używać moderacji wydań, aby
zatwierdzać, obejmować kwarantanną lub unieważniać artefakty.

Uwierzytelnianie:

- Wymaga tokenu API.

Żądanie:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Odpowiedź:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Punkt końcowy moderatora/administratora do przyjmowania zgłoszeń pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji

Odpowiedź:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Punkt końcowy właściciela/moderatora dla widoczności moderacji pakietu.

Uwierzytelnianie:

- Wymaga tokenu API właściciela pakietu, członka wydawcy, moderatora lub
  użytkownika administratora.

Odpowiedź:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Punkt końcowy moderatora/administratora do rozwiązywania lub ponownego otwierania zgłoszeń pakietów.

Żądanie:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć przy
ustawianiu `status` z powrotem na `open`. Przekaż `finalAction: "quarantine"` lub
`finalAction: "revoke"` z potwierdzonym zgłoszeniem, aby zastosować moderację wydania w tym
samym audytowalnym przepływie pracy.

Odpowiedź:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Endpoint moderatora/administratora do przeglądu wydania pakietu.

Żądanie:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Obsługiwane stany:

- `approved`: ręcznie sprawdzone i dozwolone.
- `quarantined`: zablokowane do czasu działań następczych.
- `revoked`: zablokowane po tym, jak wydanie było wcześniej zaufane.

Wydania poddane kwarantannie i unieważnione zwracają `403` z tras pobierania artefaktów.
Każda zmiana zapisuje wpis w dzienniku audytu.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint konserwacyjny tylko dla administratorów do oznaczania starszych wydań pakietów
jawnymi metadanymi rodzaju artefaktu.

Treść żądania:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Odpowiedź:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Uwagi:

- Domyślnie działa w trybie próbnym.
- Wydania bez magazynu ClawPack są oznaczane jako `legacy-zip`.
- Istniejące wiersze oparte na ClawPack, którym brakuje `artifactKind`, są naprawiane jako
  `npm-pack`.
- Nie generuje to ClawPacków ani nie modyfikuje bajtów artefaktów.

### `GET /api/v1/packages/{name}/file`

Zwraca surową treść tekstową pliku pakietu.

Parametry zapytania:

- `path` (wymagane)
- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Używa koszyka limitu odczytu, a nie koszyka pobierania.
- Pliki binarne zwracają `415`.
- Limit rozmiaru pliku: 200 KB.
- Oczekujące skany VirusTotal nie blokują odczytów; złośliwe wydania mogą nadal być wstrzymane gdzie indziej.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze, deterministyczne archiwum ZIP dla wydania pakietu.

Parametry zapytania:

- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa Plugin/pakietu są plikami zip z katalogiem głównym `package/`, dzięki czemu stare klienty OpenClaw
  nadal działają.
- Ta trasa pozostaje tylko dla ZIP. Nie strumieniuje plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` i
  `X-ClawHub-Artifact-Sha256` do kontroli integralności resolvera.
- Metadane tylko z rejestru nie są wstrzykiwane do pobieranego archiwum.
- Oczekujące skany VirusTotal nie blokują pobrań; złośliwe wydania zwracają `403`.
- Prywatne pakiety zwracają `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca packument zgodny z npm dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wymieniane są tylko wersje z przesłanymi tarballami ClawPack npm-pack.
- Starsze wersje wyłącznie ZIP są celowo pomijane.
- `dist.tarball`, `dist.integrity` i `dist.shasum` używają pól zgodnych z npm,
  aby użytkownicy mogli skierować npm do mirrora, jeśli zechcą.
- Packumenty pakietów scoped obsługują zarówno ścieżkę żądania `/api/npm/@scope/name`, jak i zakodowaną przez npm
  `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Strumieniuje dokładne bajty przesłanego tarballa ClawPack dla klientów mirrora npm.

Uwagi:

- Używa koszyka limitu pobierania.
- Nagłówki pobierania zawierają ClawHub SHA-256 oraz metadane npm integrity/shasum.
- Kontrole moderacji i dostępu do prywatnych pakietów nadal obowiązują.

### `GET /api/v1/resolve`

Używany przez CLI do mapowania lokalnego odcisku palca na znaną wersję.

Parametry zapytania:

- `slug` (wymagane)
- `hash` (wymagane): 64-znakowy hex sha256 odcisku palca pakietu

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera zip wersji skill.

Parametry zapytania:

- `slug` (wymagane)
- `version` (opcjonalne): ciąg semver
- `tag` (opcjonalne): nazwa tagu (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Miękko usunięte wersje zwracają `410`.
- Statystyki pobrań są liczone jako unikalne tożsamości na godzinę (`userId`, gdy token API jest prawidłowy, w przeciwnym razie IP).

## Endpointy uwierzytelniania (token Bearer)

Wszystkie endpointy wymagają:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Weryfikuje token i zwraca uchwyt użytkownika.

### `POST /api/v1/skills`

Publikuje nową wersję.

- Preferowane: `multipart/form-data` z JSON `payload` + blobami `files[]`.
- Akceptowana jest również treść JSON z `files` (oparta na storageId).
- Opcjonalne pole payload: `ownerHandle`. Gdy jest obecne, API rozwiązuje tego
  wydawcę po stronie serwera i wymaga, aby aktor miał dostęp do wydawcy.
- Opcjonalne pole payload: `migrateOwner`. Gdy `true` z `ownerHandle`,
  istniejący skill może zostać przeniesiony do tego właściciela, jeśli aktor jest administratorem/właścicielem u obu
  wydawców: bieżącego i docelowego. Bez tej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie code-plugin lub bundle-plugin.

- Wymaga uwierzytelnienia tokenem Bearer.
- Preferowane: `multipart/form-data` z JSON `payload` + blobami `files[]`.
- Akceptowana jest również treść JSON z `files` (oparta na storageId).
- Opcjonalne pole payload: `ownerHandle`. Gdy jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze punkty walidacji:

- `family` musi być `code-plugin` lub `bundle-plugin`.
- Pakiety Plugin wymagają `openclaw.plugin.json`. Przesyłane pliki ClawPack `.tgz` muszą
  zawierać go w `package/openclaw.plugin.json`.
- Pluginy kodu wymagają `package.json`, metadanych repozytorium źródłowego, metadanych commita źródłowego,
  metadanych schematu konfiguracji, `openclaw.compat.pluginApi` i
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` to opcjonalne metadane.
- Tylko zaufani wydawcy mogą publikować do kanału `official`.
- Publikacje w imieniu kogoś nadal walidują kwalifikowalność kanału official względem konta właściciela docelowego.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękkie usunięcie / przywrócenie skill (właściciel, moderator lub administrator).

Opcjonalna treść JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Gdy jest obecne, `reason` jest zapisywane jako notatka moderacyjna skill i kopiowane do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni, po czym slug może zostać przejęty przez
innego wydawcę. Odpowiedź usunięcia zawiera `slugReservedUntil`, gdy ten termin wygaśnięcia ma zastosowanie.
Ukrycia przez moderatora/administratora i usunięcia bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź usunięcia:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kody statusu:

- `200`: ok
- `401`: brak autoryzacji
- `403`: zabronione
- `404`: nie znaleziono skill/użytkownika
- `500`: wewnętrzny błąd serwera

### `POST /api/v1/users/publisher`

Tylko dla administratorów. Zapewnia istnienie wydawcy organizacji dla uchwytu. Jeśli uchwyt nadal wskazuje na
starszego współdzielonego użytkownika/osobistego wydawcę, endpoint najpierw migruje go do wydawcy organizacji.

- Treść: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Tylko dla administratorów. Rezerwuje główne slugi i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, więc ten sam
właściciel może później opublikować rzeczywiste wydanie code-plugin lub bundle-plugin pod tą nazwą.

- Treść: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpointy zarządzania slugiem właściciela

- `POST /api/v1/skills/{slug}/rename`
  - Treść: `{ "newSlug": "new-canonical-slug" }`
  - Odpowiedź: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Treść: `{ "targetSlug": "canonical-target-slug" }`
  - Odpowiedź: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Uwagi:

- Oba endpointy wymagają uwierzytelnienia tokenem API i działają tylko dla właściciela skill.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje źródłowy slug do wpisu docelowego.

### Endpointy przenoszenia własności

- `POST /api/v1/skills/{slug}/transfer`
  - Treść: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Odpowiedź: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Odpowiedź (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Kształt odpowiedzi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blokuje użytkownika i trwale usuwa posiadane Skills (tylko moderator/administrator).

Treść:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

lub

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Odpowiedź:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Odblokowuje użytkownika i przywraca kwalifikujące się Skills (tylko administrator).

Treść:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

lub

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Odpowiedź:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Zmienia rolę użytkownika (tylko administrator).

Treść:

```json
{ "handle": "user_handle", "role": "moderator" }
```

lub

```json
{ "userId": "users_...", "role": "admin" }
```

Odpowiedź:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Wyświetla lub wyszukuje użytkowników (tylko administrator).

Parametry zapytania:

- `q` (opcjonalne): zapytanie wyszukiwania
- `query` (opcjonalne): alias dla `q`
- `limit` (opcjonalne): maksymalna liczba wyników (domyślnie 20, maks. 200)

Odpowiedź:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Dodaje/usuwa gwiazdkę (wyróżnienia). Oba endpointy są idempotentne.

Odpowiedzi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Starsze endpointy CLI (przestarzałe)

Nadal obsługiwane dla starszych wersji CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Zobacz `DEPRECATIONS.md`, aby poznać plan usunięcia.

## Odkrywanie rejestru (`/.well-known/clawhub.json`)

CLI może odkrywać ustawienia rejestru/uwierzytelniania ze strony:

- `/.well-known/clawhub.json` (JSON, preferowane)
- `/.well-known/clawdhub.json` (starsze)

Schemat:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jeśli hostujesz samodzielnie, serwuj ten plik (lub ustaw jawnie `CLAWHUB_REGISTRY`; starsze `CLAWDHUB_REGISTRY`).
