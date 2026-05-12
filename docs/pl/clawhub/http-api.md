---
read_when:
    - Dodawanie/zmiana punktów końcowych
    - Debugowanie żądań CLI ↔ rejestru
summary: Dokumentacja referencyjna API HTTP (publiczne + punkty końcowe CLI + uwierzytelnianie).
x-i18n:
    generated_at: "2026-05-12T08:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

Bazowy adres URL: `https://clawhub.ai` (domyślnie).

Wszystkie ścieżki v1 znajdują się pod `/api/v1/...`.
Starsze `/api/...` i `/api/cli/...` pozostają dla zgodności (zobacz `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Ponowne użycie katalogu publicznego

Katalogi innych firm mogą używać publicznych punktów końcowych odczytu do wyświetlania listy lub wyszukiwania Skills ClawHub. Buforuj wyniki, honoruj `429`/`Retry-After`, odsyłaj użytkowników do kanonicznej listy ClawHub (`https://clawhub.ai/<owner>/<slug>`) i unikaj sugerowania poparcia ClawHub dla witryny innej firmy. Nie próbuj odzwierciedlać ukrytych, prywatnych ani zablokowanych przez moderację treści poza publiczną powierzchnią API.

Skróty slugów webowych są rozwiązywane między rodzinami rejestru, ale klienci API powinni używać
kanonicznych adresów URL zwracanych przez punkty końcowe odczytu zamiast rekonstruować priorytet
tras.

## Limity szybkości

Model egzekwowania:

- Żądania anonimowe: egzekwowane per IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): egzekwowane per koszyk użytkownika.
- Jeśli tokenu brakuje lub jest nieprawidłowy, zachowanie przechodzi na egzekwowanie według IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać samego `Unauthorized`, gdy
  serwer zna powód. Brakujące tokeny, nieprawidłowe/odwołane tokeny oraz
  usunięte/zbanowane/wyłączone konta powinny otrzymywać tekst umożliwiający działanie, aby klienci
  CLI mogli powiedzieć użytkownikom, co ich zablokowało.

- Odczyt: 600/min per IP, 2400/min per klucz
- Zapis: 45/min per IP, 180/min per klucz
- Pobieranie: 30/min per IP, 180/min per klucz (`/api/v1/download`)

Nagłówki:

- Zgodność ze starszymi wersjami: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Ustandaryzowane: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Przy `429`: `Retry-After`

Semantyka nagłówków:

- `X-RateLimit-Reset`: bezwzględne sekundy epoki Unix
- `RateLimit-Reset`: sekundy do resetu (opóźnienie)
- `Retry-After`: liczba sekund oczekiwania przed ponowną próbą (opóźnienie) przy `429`

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

Wskazówki dla klienta:

- Jeśli istnieje `Retry-After`, odczekaj tyle sekund przed ponowną próbą.
- Używaj backoffu z jitterem, aby uniknąć zsynchronizowanych ponownych prób.
- Jeśli brakuje `Retry-After`, użyj awaryjnie `RateLimit-Reset` (lub oblicz z `X-RateLimit-Reset`).

Źródło IP:

- Domyślnie używa `cf-connecting-ip` (Cloudflare) jako IP klienta.
- ClawHub używa zaufanych nagłówków przekazywania do identyfikacji IP klientów na brzegu sieci.
- Jeśli nie jest dostępny żaden zaufany IP klienta, anonimowe żądania pobierania używają awaryjnego koszyka ograniczonego do punktu końcowego zamiast jednego globalnego koszyka `ip:unknown`. Anonimowe żądania odczytu/zapisu nadal używają współdzielonego nieznanego koszyka, aby routing bez IP pozostał widoczny i konserwatywny.

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

- Wyniki są zwracane w kolejności trafności (podobieństwo osadzeń + wzmocnienia dokładnych tokenów sluga/nazwy + wcześniejsze prawdopodobieństwo popularności z pobrań).
- Trafność jest silniejsza niż popularność. Dokładne dopasowanie tokena sluga lub nazwy wyświetlanej może wyprzedzić luźniejsze dopasowanie z dużo większą liczbą pobrań.
- Tekst ASCII jest tokenizowany na granicach słów i interpunkcji. Na przykład `personal-map` zawiera samodzielny token `map`, podczas gdy `amap-jsapi-skill` zawiera `amap`, `jsapi` i `skill`; wyszukanie `map` daje więc `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Pobrania są używane jako niewielki, skalowany logarytmicznie priorytet i rozstrzygacz remisów, a nie jako główny sygnał rankingu. Skills z dużą liczbą pobrań mogą znaleźć się niżej, gdy tekst zapytania jest słabszym dopasowaniem.
- Podejrzany lub ukryty stan moderacji może usunąć Skill z publicznego wyszukiwania zależnie od filtrów wywołującego i bieżącego statusu moderacji.

Wskazówki dotyczące wykrywalności dla wydawców:

- Umieść terminy, których użytkownicy będą dosłownie szukać, w nazwie wyświetlanej, podsumowaniu i tagach. Używaj samodzielnego tokena sluga tylko wtedy, gdy jest on także stabilną tożsamością, którą chcesz zachować.
- Nie zmieniaj nazwy sluga tylko po to, aby gonić za jednym zapytaniem, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny adres URL, wyświetlany slug i przyszłe digesty wyszukiwania używają nowego sluga.
- Aliasy zmiany nazwy zachowują rozwiązywanie dla starych adresów URL i instalacji rozwiązywanych przez rejestr, ale ranking wyszukiwania opiera się na kanonicznych metadanych Skill po zaindeksowaniu zmiany nazwy. Istniejące statystyki pozostają przy Skill.
- Jeśli Skill jest nieoczekiwanie niewidoczny, najpierw sprawdź stan moderacji za pomocą `clawhub inspect <slug>` po zalogowaniu, zanim zmienisz metadane związane z rankingiem.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–200)
- `cursor` (opcjonalne): kursor paginacji dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalne): `updated` (domyślnie), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalne): starszy alias dla `nonSuspiciousOnly`

Uwagi:

- `trending` klasyfikuje według instalacji z ostatnich 7 dni (na podstawie telemetrii).
- `createdAt` jest stabilne dla indeksowania nowych Skills; `updated` zmienia się, gdy istniejące Skills są publikowane ponownie.
- Gdy `nonSuspiciousOnly=true`, sortowania oparte na kursorze mogą zwrócić na stronie mniej niż `limit` elementów, ponieważ podejrzane Skills są filtrowane po pobraniu strony.
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

- Stare slugi utworzone przez przepływy zmiany nazwy/scalania właściciela rozwiązują się do kanonicznego Skill.
- `metadata.os`: ograniczenia systemu operacyjnego zadeklarowane w frontmatter Skill (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata.systems`: docelowe systemy Nix (np. `["aarch64-darwin", "x86_64-linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata` ma wartość `null`, jeśli Skill nie ma metadanych platformy.
- `moderation` jest uwzględniane tylko wtedy, gdy Skill jest oflagowany albo ogląda go właściciel.

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
- Publiczni wywołujący otrzymują `200` tylko dla już oflagowanych widocznych Skills.
- Materiał dowodowy jest redagowany dla publicznych wywołujących i obejmuje surowe fragmenty tylko dla właścicieli/moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłoś Skill do przeglądu moderatora. Zgłoszenia są na poziomie Skill, opcjonalnie powiązane
z wersją, i trafiają do kolejki zgłoszeń Skill.

Uwierzytelnianie:

- Wymaga tokena API.

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

Punkt końcowy moderatora/administratora do przyjmowania zgłoszeń Skill.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
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

Punkt końcowy moderatora/administratora do rozwiązywania lub ponownego otwierania zgłoszeń Skill.

Żądanie:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas
ustawiania `status` z powrotem na `open`. Przekaż `finalAction: "hide"` ze zgłoszeniem po triage,
aby ukryć Skill w tym samym audytowalnym przepływie pracy.

### `GET /api/v1/skills/{slug}/versions`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita
- `cursor` (opcjonalne): kursor paginacji

### `GET /api/v1/skills/{slug}/versions/{version}`

Zwraca metadane wersji + listę plików.

- `version.security` obejmuje znormalizowany status weryfikacji skanowania i szczegóły skanera
  (VirusTotal + LLM), gdy są dostępne.

### `GET /api/v1/skills/{slug}/scan`

Zwraca szczegóły weryfikacji skanowania bezpieczeństwa dla wersji Skill.

Parametry zapytania:

- `version` (opcjonalne): konkretny ciąg wersji.
- `tag` (opcjonalne): rozwiąż otagowaną wersję (na przykład `latest`).

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używa najnowszej wersji.
- Obejmuje znormalizowany status weryfikacji oraz szczegóły specyficzne dla skanera.
- `security.capabilityTags` obejmuje deterministyczne etykiety możliwości/ryzyka, takie jak
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` i `posts-externally`, gdy zostaną wykryte.
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wygenerował definitywny werdykt (`clean`, `suspicious` lub `malicious`).
- `moderation` jest bieżącą migawką moderacji na poziomie Skill, wyprowadzoną z najnowszej wersji.
- Podczas zapytania o wersję historyczną sprawdź `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim potraktujesz `moderation` i `security` jako ten sam kontekst wersji.

### `GET /api/v1/skills/{slug}/file`

Zwraca surową treść tekstową.

Parametry zapytania:

- `path` (wymagane)
- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszej wersji.
- Limit rozmiaru pliku: 200KB.

### `GET /api/v1/packages`

Ujednolicony punkt końcowy katalogu dla:

- Skills
- Plugin kodu
- Plugin pakietów

Parametry zapytania:

- `limit` (opcjonalnie): liczba całkowita (1–100)
- `cursor` (opcjonalnie): kursor paginacji
- `family` (opcjonalnie): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalnie): `official`, `community` lub `private`
- `isOfficial` (opcjonalnie): `true` lub `false`
- `executesCode` (opcjonalnie): `true` lub `false`
- `capabilityTag` (opcjonalnie): filtr możliwości dla pakietów pluginów
- `target` / `hostTarget` (opcjonalnie): skrót dla `host:<target>`
- `os`, `arch`, `libc` (opcjonalnie): skrót dla filtrów możliwości hosta
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opcjonalnie): skrót `true`/`1` dla tagów wymagań środowiska
- `externalService`, `binary`, `osPermission` (opcjonalnie): skrót dla nazwanych
  tagów wymagań środowiska
- `artifactKind` (opcjonalnie): `legacy-zip` lub `npm-pack`
- `npmMirror` (opcjonalnie): `true`/`1`, aby pokazać wersje pakietów opartych na ClawPack,
  dostępne przez lustro npm

Uwagi:

- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami stałej rodziny.
- Wpisy Skills nadal są wspierane przez rejestr umiejętności i nadal można je publikować tylko przez `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy tylko do wydań code-plugin i bundle-plugin.
- Wywołujący anonimowi widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą widzieć prywatne pakiety wydawców, do których należą, w wynikach listy/wyszukiwania.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie katalogu obejmujące umiejętności i pakiety pluginów.

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalnie): liczba całkowita (1–100)
- `family` (opcjonalnie): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalnie): `official`, `community` lub `private`
- `isOfficial` (opcjonalnie): `true` lub `false`
- `executesCode` (opcjonalnie): `true` lub `false`
- `capabilityTag` (opcjonalnie): filtr możliwości dla pakietów pluginów
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` i
  `osPermission` są akceptowane jako skróty dla typowych tagów możliwości
- `artifactKind` (opcjonalnie): `legacy-zip` lub `npm-pack`
- `npmMirror` (opcjonalnie): `true`/`1`, aby wyszukiwać wersje pakietów opartych na ClawPack,
  dostępne przez lustro npm

Uwagi:

- Wywołujący anonimowi widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.
- Filtry artefaktów są obsługiwane przez indeksowane tagi możliwości:
  `artifact:legacy-zip`, `artifact:npm-pack` i `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Zwraca metadane szczegółów pakietu.

Uwagi:

- Skills mogą też być rozwiązywane przez tę trasę w ujednoliconym katalogu.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `DELETE /api/v1/packages/{name}`

Miękko usuwa pakiet i wszystkie wydania.

Uwagi:

- Wymaga tokenu API właściciela pakietu, właściciela/administratora wydawcy organizacji,
  moderatora platformy lub administratora platformy.

### `GET /api/v1/packages/{name}/versions`

Zwraca historię wersji.

Parametry zapytania:

- `limit` (opcjonalnie): liczba całkowita (1–100)
- `cursor` (opcjonalnie): kursor paginacji

Uwagi:

- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/versions/{version}`

Zwraca jedną wersję pakietu, w tym metadane plików, zgodność,
możliwości, weryfikację, metadane artefaktu i dane skanowania.

Uwagi:

- `version.artifact.kind` ma wartość `legacy-zip` dla archiwów pakietów starego typu lub
  `npm-pack` dla wydań opartych na ClawPack.
- Wydania ClawPack zawierają pola zgodne z npm: `npmIntegrity`, `npmShasum` i
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` i `version.staticScan` są uwzględniane, gdy istnieją dane skanowania.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane resolwera artefaktu dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` oraz starszy
  `downloadUrl` ZIP.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm,
  `tarballUrl` oraz adres URL zgodności ze starszym ZIP.
- To jest powierzchnia resolwera OpenClaw; unika zgadywania formatu archiwum na podstawie
  współdzielonego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji przez jawną ścieżkę resolwera.

Uwagi:

- Wersje ClawPack strumieniują dokładne bajty przesłanego `.tgz` npm-pack.
- Starsze wersje ZIP przekierowują do `/api/v1/packages/{name}/download?version=`.
- Używa zasobnika limitu szybkości pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczoną gotowość do przyszłego użycia przez OpenClaw.

Kontrole gotowości obejmują:

- status oficjalnego kanału
- dostępność najnowszej wersji
- dostępność artefaktu npm-pack ClawPack
- skrót artefaktu
- repozytorium źródłowe i pochodzenie commita
- metadane zgodności OpenClaw
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

Punkt końcowy moderatora do wyświetlania wierszy migracji oficjalnych pluginów OpenClaw.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora lub administratora.

Parametry zapytania:

- `phase` (opcjonalnie): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` lub
  `all` (domyślnie).
- `limit` (opcjonalnie): liczba całkowita (1-100)
- `cursor` (opcjonalnie): kursor paginacji

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

Punkt końcowy administratora do tworzenia lub aktualizowania wiersza migracji oficjalnego pluginu.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika administratora.

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

- `bundledPluginId` jest normalizowany do małych liter i jest stabilnym kluczem upsert.
- `packageName` jest normalizowany jako nazwa npm; pakiet może być brakujący dla planowanych
  migracji.
- To śledzi tylko gotowość migracji. Nie modyfikuje OpenClaw ani nie generuje
  ClawPacków.

### `GET /api/v1/packages/moderation/queue`

Punkt końcowy moderatora/administratora dla kolejek przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora lub administratora.

Parametry zapytania:

- `status` (opcjonalnie): `open` (domyślnie), `blocked`, `manual` lub `all`
- `limit` (opcjonalnie): liczba całkowita (1-100)
- `cursor` (opcjonalnie): kursor paginacji

Znaczenia statusów:

- `open`: podejrzane, złośliwe, oczekujące, poddane kwarantannie, unieważnione lub zgłoszone wydania.
- `blocked`: wydania poddane kwarantannie, unieważnione lub złośliwe.
- `manual`: dowolne wydanie z ręcznym zastąpieniem moderacji.
- `all`: dowolne wydanie z ręcznym zastąpieniem, nieczystym stanem skanowania lub zgłoszeniem pakietu.

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

Zgłasza pakiet do przeglądu przez moderatora. Zgłoszenia są na poziomie pakietu, opcjonalnie
powiązane z wersją. Zasilają kolejkę moderacji, ale same nie ukrywają automatycznie ani
nie blokują pobrań; moderatorzy powinni używać moderacji wydań, aby
zatwierdzać, poddawać kwarantannie lub unieważniać artefakty.

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

- Wymaga tokenu API użytkownika moderatora lub administratora.

Parametry zapytania:

- `status` (opcjonalnie): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
- `limit` (opcjonalnie): liczba całkowita (1-100)
- `cursor` (opcjonalnie): kursor paginacji

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

Punkt końcowy właściciela/moderatora do widoczności moderacji pakietu.

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

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas
ustawiania `status` z powrotem na `open`. Przekaż `finalAction: "quarantine"` lub
`finalAction: "revoke"` wraz z potwierdzonym zgłoszeniem, aby zastosować moderację wydania w tym
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

Punkt końcowy dla moderatorów/administratorów do przeglądu wydań pakietów.

Żądanie:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Obsługiwane stany:

- `approved`: ręcznie sprawdzone i dozwolone.
- `quarantined`: zablokowane do czasu dalszych działań.
- `revoked`: zablokowane po tym, jak wydanie było wcześniej uznane za zaufane.

Wydania objęte kwarantanną i unieważnione zwracają `403` z tras pobierania artefaktów.
Każda zmiana zapisuje wpis w dzienniku audytu.

### `POST /api/v1/packages/backfill/artifacts`

Dostępny tylko dla administratorów punkt końcowy utrzymaniowy do oznaczania starszych wydań pakietów
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
- Istniejące wiersze oparte na ClawPack, w których brakuje `artifactKind`, są naprawiane jako
  `npm-pack`.
- To nie generuje ClawPacks ani nie modyfikuje bajtów artefaktów.

### `GET /api/v1/packages/{name}/file`

Zwraca surową treść tekstową pliku pakietu.

Parametry zapytania:

- `path` (wymagane)
- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Używa limitu szybkości odczytu, a nie limitu pobierania.
- Pliki binarne zwracają `415`.
- Limit rozmiaru pliku: 200KB.
- Oczekujące skany VirusTotal nie blokują odczytów; złośliwe wydania nadal mogą być wstrzymywane gdzie indziej.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytywać dane wydawcy będącego właścicielem.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze, deterministyczne archiwum ZIP dla wydania pakietu.

Parametry zapytania:

- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa Plugin/pakietów są plikami zip z katalogiem głównym `package/`, dzięki czemu starsi klienci OpenClaw
  nadal działają.
- Ta trasa pozostaje wyłącznie ZIP. Nie strumieniuje plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` i
  `X-ClawHub-Artifact-Sha256` do kontroli integralności przez resolver.
- Metadane dostępne tylko w rejestrze nie są wstrzykiwane do pobieranego archiwum.
- Oczekujące skany VirusTotal nie blokują pobrań; złośliwe wydania zwracają `403`.
- Prywatne pakiety zwracają `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca zgodny z npm packument dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wymieniane są tylko wersje z przesłanymi archiwami tarball ClawPack typu npm-pack.
- Starsze wersje dostępne tylko jako ZIP są celowo pomijane.
- `dist.tarball`, `dist.integrity` i `dist.shasum` używają pól zgodnych z npm,
  aby użytkownicy mogli wskazać npm serwer lustrzany, jeśli tak wybiorą.
- Packumenty pakietów z zakresem obsługują zarówno ścieżkę żądania `/api/npm/@scope/name`, jak i
  zakodowaną ścieżkę żądania npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Strumieniuje dokładne przesłane bajty archiwum tarball ClawPack dla klientów serwera lustrzanego npm.

Uwagi:

- Używa limitu szybkości pobierania.
- Nagłówki pobierania zawierają SHA-256 ClawHub oraz metadane npm integrity/shasum.
- Kontrole moderacji i dostępu do prywatnych pakietów nadal obowiązują.

### `GET /api/v1/resolve`

Używany przez CLI do mapowania lokalnego odcisku na znaną wersję.

Parametry zapytania:

- `slug` (wymagane)
- `hash` (wymagane): 64-znakowy szesnastkowy sha256 odcisku pakietu zbiorczego

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera archiwum zip wersji umiejętności.

Parametry zapytania:

- `slug` (wymagane)
- `version` (opcjonalne): ciąg semver
- `tag` (opcjonalne): nazwa tagu (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Wersje usunięte miękko zwracają `410`.
- Statystyki pobrań są zliczane jako unikalne tożsamości na godzinę (`userId`, gdy token API jest ważny, w przeciwnym razie IP).

## Punkty końcowe uwierzytelniania (token Bearer)

Wszystkie punkty końcowe wymagają:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Sprawdza poprawność tokenu i zwraca uchwyt użytkownika.

### `POST /api/v1/skills`

Publikuje nową wersję.

- Preferowane: `multipart/form-data` z JSON `payload` + obiektami blob `files[]`.
- Akceptowana jest także treść JSON z `files` (oparta na storageId).
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, API rozwiązuje tego
  wydawcę po stronie serwera i wymaga, aby wykonawca miał dostęp do wydawcy.
- Opcjonalne pole ładunku: `migrateOwner`. Gdy ma wartość `true` wraz z `ownerHandle`, istniejąca
  umiejętność może zostać przeniesiona do tego właściciela, jeśli wykonawca jest administratorem/właścicielem zarówno u
  obecnego, jak i docelowego wydawcy. Bez tej wyraźnej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie code-plugin lub bundle-plugin.

- Wymaga uwierzytelniania tokenem Bearer.
- Preferowane: `multipart/form-data` z JSON `payload` + obiektami blob `files[]`.
- Akceptowana jest także treść JSON z `files` (oparta na storageId).
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze elementy walidacji:

- `family` musi być `code-plugin` albo `bundle-plugin`.
- Pakiety typu Plugin wymagają `openclaw.plugin.json`. Przesyłane pliki ClawPack `.tgz` muszą
  zawierać go w `package/openclaw.plugin.json`.
- Pluginy kodowe wymagają `package.json`, metadanych repozytorium źródłowego, metadanych commita
  źródłowego, metadanych schematu konfiguracji, `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` to opcjonalne metadane.
- Tylko zaufani wydawcy mogą publikować w kanale `official`.
- Publikacje w imieniu nadal sprawdzają uprawnienie do oficjalnego kanału względem docelowego konta właściciela.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękko usuwa / przywraca umiejętność (właściciel, moderator lub administrator).

Opcjonalna treść JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Gdy jest obecne, `reason` jest przechowywane jako notatka moderacyjna umiejętności i kopiowane do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni, po czym slug może zostać przejęty przez
innego wydawcę. Odpowiedź usunięcia zawiera `slugReservedUntil`, gdy ma zastosowanie ten termin wygaśnięcia.
Ukrycia przez moderatora/administratora i usunięcia ze względów bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź usunięcia:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kody stanu:

- `200`: powodzenie
- `401`: nieuwierzytelniony
- `403`: zabronione
- `404`: nie znaleziono umiejętności/użytkownika
- `500`: wewnętrzny błąd serwera

### `POST /api/v1/users/publisher`

Tylko dla administratorów. Zapewnia istnienie wydawcy organizacji dla uchwytu. Jeśli uchwyt nadal wskazuje na
starszego współdzielonego wydawcę użytkownika/osobistego, punkt końcowy najpierw migruje go do wydawcy organizacji.

- Treść: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Tylko dla administratorów. Rezerwuje główne slugi i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, więc ten sam
właściciel może później opublikować prawdziwe wydanie code-plugin lub bundle-plugin pod tą nazwą.

- Treść: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Punkty końcowe zarządzania slugami właściciela

- `POST /api/v1/skills/{slug}/rename`
  - Treść: `{ "newSlug": "new-canonical-slug" }`
  - Odpowiedź: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Treść: `{ "targetSlug": "canonical-target-slug" }`
  - Odpowiedź: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Uwagi:

- Oba punkty końcowe wymagają uwierzytelniania tokenem API i działają tylko dla właściciela umiejętności.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje slug źródłowy do wpisu docelowego.

### Punkty końcowe przenoszenia własności

- `POST /api/v1/skills/{slug}/transfer`
  - Treść: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Odpowiedź: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Odpowiedź (przyjęcie/odrzucenie/anulowanie): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Struktura odpowiedzi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Banuje użytkownika i trwale usuwa jego umiejętności (tylko moderator/administrator).

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

Odbanowuje użytkownika i przywraca kwalifikujące się umiejętności (tylko administrator).

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

Wyświetla listę użytkowników lub wyszukuje użytkowników (tylko administrator).

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

Dodaje/usuwa gwiazdkę (wyróżnienia). Oba punkty końcowe są idempotentne.

Odpowiedzi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Starsze punkty końcowe CLI (przestarzałe)

Nadal obsługiwane dla starszych wersji CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Plan usunięcia znajduje się w `DEPRECATIONS.md`.

## Wykrywanie rejestru (`/.well-known/clawhub.json`)

CLI może wykrywać ustawienia rejestru/uwierzytelniania z witryny:

- `/.well-known/clawhub.json` (JSON, preferowane)
- `/.well-known/clawdhub.json` (starsze)

Schemat:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jeśli hostujesz samodzielnie, udostępnij ten plik (albo jawnie ustaw `CLAWHUB_REGISTRY`; starsze `CLAWDHUB_REGISTRY`).
