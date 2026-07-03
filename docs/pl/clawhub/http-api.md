---
read_when:
    - Dodawanie/zmienianie punktów końcowych
    - Debugowanie żądań CLI ↔ rejestr
summary: Dokumentacja referencyjna API HTTP (publiczne + punkty końcowe CLI + uwierzytelnianie).
x-i18n:
    generated_at: "2026-07-03T10:00:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

Bazowy URL: `https://clawhub.ai` (domyślnie).

Wszystkie ścieżki v1 znajdują się pod `/api/v1/...`.
Starsze `/api/...` i `/api/cli/...` pozostają dla zgodności (zobacz `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Ponowne użycie publicznego katalogu

Katalogi firm trzecich mogą używać publicznych punktów końcowych odczytu do listowania lub wyszukiwania umiejętności ClawHub. Buforuj wyniki, respektuj `429`/`Retry-After`, odsyłaj użytkowników do kanonicznej pozycji ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) i unikaj sugerowania, że ClawHub popiera witrynę firmy trzeciej. Nie próbuj tworzyć kopii ukrytych, prywatnych ani zablokowanych przez moderację treści poza publiczną powierzchnią API.

Skróty slugów webowych są rozwiązywane między rodzinami rejestru, ale klienci API powinni używać
kanonicznych URL-i zwracanych przez punkty końcowe odczytu zamiast odtwarzać pierwszeństwo
tras.

## Limity szybkości

Model egzekwowania:

- Żądania anonimowe: egzekwowane według IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): egzekwowane według koszyka użytkownika.
- Jeśli tokenu brakuje lub jest nieprawidłowy, zachowanie wraca do egzekwowania według IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać samego `Unauthorized`, gdy
  serwer zna przyczynę. Brakujące tokeny, nieprawidłowe/unieważnione tokeny oraz
  usunięte/zbanowane/wyłączone konta powinny otrzymywać tekst umożliwiający działanie, aby klienci
  CLI mogli powiedzieć użytkownikom, co ich zablokowało.

- Odczyt: 3000/min na IP, 12000/min na klucz
- Zapis: 300/min na IP, 3000/min na klucz
- Pobieranie: 1200/min na IP, 6000/min na klucz (punkty końcowe pobierania)

Nagłówki:

- Zgodność ze starszymi wersjami: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standaryzowane: `RateLimit-Limit`, `RateLimit-Reset`
- Przy `429`: `X-RateLimit-Remaining: 0` i `RateLimit-Remaining: 0`
- Przy `429`: `Retry-After`

Semantyka nagłówków:

- `X-RateLimit-Reset`: bezwzględne sekundy epoki Unix
- `RateLimit-Reset`: sekundy do resetu (opóźnienie)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały budżet, gdy jest obecny.
  Udane żądania w środowisku podzielonym na shardy pomijają ten nagłówek zamiast zwracać przybliżoną wartość globalną.
- `Retry-After`: liczba sekund oczekiwania przed ponowieniem (opóźnienie) przy `429`

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

- Jeśli istnieje `Retry-After`, odczekaj tyle sekund przed ponowieniem.
- Używaj wycofywania z losowym jitterem, aby uniknąć zsynchronizowanych ponowień.
- Jeśli brakuje `Retry-After`, użyj awaryjnie `RateLimit-Reset` (lub oblicz z `X-RateLimit-Reset`).

Źródło IP:

- Używa zaufanych nagłówków IP klienta, w tym `cf-connecting-ip`, tylko gdy
  wdrożenie jawnie włącza zaufane nagłówki przekazywane.
- ClawHub używa zaufanych nagłówków przekazywania do identyfikowania IP klientów na brzegu sieci.
- Jeśli żaden zaufany IP klienta nie jest dostępny, żądania anonimowe używają koszyków awaryjnych
  zawężonych tylko według rodzaju limitu szybkości. Te koszyki awaryjne nie obejmują
  ścieżek, slugów, nazw pakietów, wersji, ciągów zapytań ani innych
  parametrów artefaktów dostarczanych przez wywołującego.

## Odpowiedzi błędów

Publiczne odpowiedzi błędów v1 są zwykłym tekstem z `content-type: text/plain; charset=utf-8`.
Obejmuje to błędy walidacji (`400`), brakujące publiczne zasoby (`404`), błędy uwierzytelniania i
uprawnień (`401`/`403`), limity szybkości (`429`) oraz zablokowane pobierania. Klienci
powinni odczytywać treść odpowiedzi jako czytelny dla człowieka ciąg znaków. Nieznane parametry zapytania są
ignorowane dla zgodności, ale rozpoznane parametry zapytania z nieprawidłowymi wartościami zwracają
`400`.

## Publiczne punkty końcowe (bez uwierzytelniania)

### `GET /api/v1/search`

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita
- `highlightedOnly` (opcjonalne): `true`, aby filtrować do wyróżnionych umiejętności
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) umiejętności
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Uwagi:

- Wyniki są zwracane w kolejności trafności (podobieństwo osadzeń + wzmocnienia dokładnych tokenów sluga/nazwy + mały priorytet popularności).
- Trafność jest silniejsza niż popularność. Precyzyjne dopasowanie tokenu sluga lub nazwy wyświetlanej może wyprzedzić luźniejsze dopasowanie ze znacznie większym zaangażowaniem.
- Tekst ASCII jest tokenizowany na granicach słów i interpunkcji. Na przykład `personal-map` zawiera samodzielny token `map`, podczas gdy `amap-jsapi-skill` zawiera `amap`, `jsapi` i `skill`; wyszukanie `map` daje więc `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Popularność jest skalowana logarytmicznie i ograniczona. Umiejętności o wysokim zaangażowaniu mogą zajmować niższe pozycje, gdy tekst zapytania jest słabszym dopasowaniem.
- Podejrzany lub ukryty stan moderacji może usunąć umiejętność z publicznego wyszukiwania zależnie od filtrów wywołującego i bieżącego statusu moderacji.

Wytyczne dotyczące odkrywalności dla wydawców:

- Umieść terminy, których użytkownicy będą dosłownie szukać, w nazwie wyświetlanej, podsumowaniu i tagach. Używaj samodzielnego tokenu sluga tylko wtedy, gdy jest też stabilną tożsamością, którą chcesz zachować.
- Nie zmieniaj sluga tylko po to, aby gonić za jednym zapytaniem, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny URL, wyświetlany slug i przyszłe zestawienia wyszukiwania używają nowego sluga.
- Aliasy zmiany nazwy zachowują rozwiązywanie dla starych URL-i i instalacji rozwiązywanych przez rejestr, ale ranking wyszukiwania opiera się na kanonicznych metadanych umiejętności po zaindeksowaniu zmiany nazwy. Istniejące statystyki pozostają przy umiejętności.
- Jeśli umiejętność jest niespodziewanie niewidoczna, najpierw sprawdź stan moderacji za pomocą `clawhub inspect @owner/slug` po zalogowaniu, zanim zmienisz metadane związane z rankingiem.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–200)
- `cursor` (opcjonalne): kursor paginacji dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalne): `updated` (domyślnie), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` mapują się na `downloads`, `trending`
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) umiejętności
- `nonSuspicious` (opcjonalne): starszy alias dla `nonSuspiciousOnly`

Nieprawidłowe wartości `sort` zwracają `400`.

Uwagi:

- `recommended` używa sygnałów zaangażowania i świeżości.
- `trending` szereguje według instalacji z ostatnich 7 dni (na podstawie telemetrii).
- `createdAt` jest stabilne dla indeksowania nowych umiejętności; `updated` zmienia się, gdy istniejące umiejętności są publikowane ponownie.
- Gdy `nonSuspiciousOnly=true`, sortowania oparte na kursorze mogą zwracać mniej niż `limit` elementów na stronie, ponieważ podejrzane umiejętności są filtrowane po pobraniu strony.
- Użyj `nextCursor`, aby kontynuować paginację, gdy jest obecny. Krótka strona sama w sobie nie oznacza końca wyników.

Odpowiedź:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- Stare slugi utworzone przez przepływy zmiany nazwy/scalania właściciela rozwiązują się do kanonicznej umiejętności.
- `metadata.os`: ograniczenia systemu operacyjnego zadeklarowane we frontmatter umiejętności (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata.systems`: cele systemów Nix (np. `["aarch64-darwin", "x86_64-linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata` ma wartość `null`, jeśli umiejętność nie ma metadanych platformy.
- `moderation` jest uwzględniane tylko wtedy, gdy umiejętność jest oznaczona albo właściciel ją wyświetla.

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

- Właściciele i moderatorzy mogą uzyskać dostęp do szczegółów moderacji dla ukrytych umiejętności.
- Publiczni wywołujący otrzymują `200` tylko dla już oznaczonych widocznych umiejętności.
- Dowody są redagowane dla publicznych wywołujących i zawierają surowe fragmenty tylko dla właścicieli/moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłoś umiejętność do weryfikacji przez moderatora. Zgłoszenia dotyczą poziomu umiejętności, opcjonalnie są powiązane
z wersją i trafiają do kolejki zgłoszeń umiejętności.

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

Punkt końcowy moderatora/administratora do przyjmowania zgłoszeń umiejętności.

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

Punkt końcowy moderatora/administratora do rozwiązywania lub ponownego otwierania zgłoszeń umiejętności.

Żądanie:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas
ustawiania `status` z powrotem na `open`. Przekaż `finalAction: "hide"` z poddanym triage
zgłoszeniem, aby ukryć umiejętność w tym samym audytowalnym przepływie pracy.

### `GET /api/v1/skills/{slug}/versions`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita
- `cursor` (opcjonalne): kursor paginacji

### `GET /api/v1/skills/{slug}/versions/{version}`

Zwraca metadane wersji + listę plików.

- `version.security` obejmuje znormalizowany status weryfikacji skanu i szczegóły skanera
  (VirusTotal + LLM), gdy są dostępne.

### `GET /api/v1/skills/{slug}/scan`

Zwraca szczegóły weryfikacji skanu bezpieczeństwa dla wersji umiejętności.

Parametry zapytania:

- `version` (opcjonalne): konkretny ciąg wersji.
- `tag` (opcjonalne): rozwiąż otagowaną wersję (na przykład `latest`).

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Zawiera znormalizowany stan weryfikacji oraz szczegóły specyficzne dla skanera.
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wygenerował jednoznaczny werdykt (`clean`, `suspicious` lub `malicious`).
- `moderation` to bieżąca migawka moderacji na poziomie skillu, wyprowadzona z najnowszej wersji.
- Przy odpytywaniu wersji historycznej sprawdź `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim potraktujesz `moderation` i `security` jako ten sam kontekst wersji.

### `POST /api/v1/skills/-/scan`

Uwierzytelniony punkt końcowy przesyłania dla nowych zadań ClawScan.

Skanowanie lokalnie przesyłanych plików nie jest już obsługiwane. Żądania używające
`multipart/form-data` lub `{ "source": { "kind": "upload" } }` zwracają `410`.

Opublikowane skany używają JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Uwagi:

- Ładunki żądań skanowania i raporty do pobrania wygasają w magazynie żądań skanowania po okresie retencji.
- Opublikowane skany wymagają dostępu właściciela/wydawcy do zarządzania albo uprawnień moderatora/administratora platformy.
- Opublikowane skany zapisują wynik zwrotnie tylko wtedy, gdy `update: true` i skan zakończy się powodzeniem.
- Odpowiedź to `202` z `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Zadania skanowania są asynchroniczne. Ręczne żądania skanowania mają priorytet przed zwykłą pracą publikowania/uzupełniania, ale ukończenie nadal zależy od dostępności workerów.

### `GET /api/v1/skills/-/scan/{scanId}`

Uwierzytelniony punkt końcowy odpytywania dla przesłanego skanu.

- Zwraca stan w kolejce/w trakcie działania/zakończony powodzeniem/nieudany.
- Zwraca `queue.queuedAhead` i `queue.position`, gdy zadanie jest w kolejce, aby klienci mogli pokazać, ile priorytetowych ręcznych skanów jest przed żądaniem. Bardzo duże kolejki są ograniczane i raportowane z `queuedAheadIsEstimate: true`.
- Gdy jest dostępny, `report` zawiera sekcje `clawscan`, `skillspector`, `staticAnalysis` i `virustotal`.
- Nieudane zadania skanowania zwracają `status: "failed"` z `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Uwierzytelniony punkt końcowy archiwum raportu.

- Wymaga skanu zakończonego powodzeniem; skany w stanie nieterminalnym zwracają `409`.
- Zwraca ZIP z `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` i `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Uwierzytelniony punkt końcowy przechowywanego archiwum raportu dla przesłanych wersji.

- Wymaga dostępu właściciela/wydawcy do zarządzania skillem lub pluginem albo uprawnień moderatora/administratora platformy.
- Zwraca przechowywane wyniki skanowania dla dokładnie przesłanej wersji, w tym wersji zablokowanych lub ukrytych.
- `kind` domyślnie ma wartość `skill`; użyj `kind=plugin` dla skanów pluginu/pakietu.
- Zwraca taki sam kształt ZIP jak pobrania żądań skanowania.

### `POST /api/v1/skills/-/scan/batch`

Kanonizacja administracyjna trasa ponownego skanowania wsadowego. Akceptuje taki sam kształt ładunku jak starsze `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Kanonizacja administracyjna trasa stanu wsadu. Akceptuje `{ "jobIds": ["..."] }` i zwraca takie same zagregowane liczniki jak starsze `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Zwraca kopertę weryfikacji Skill Card używaną przez `clawhub skill verify`.

Parametry zapytania:

- `version` (opcjonalne): konkretny ciąg wersji.
- `tag` (opcjonalne): rozwiąż otagowaną wersję (na przykład `latest`).

Uwagi:

- `ok` ma wartość `true` tylko wtedy, gdy wybrana wersja ma wygenerowaną Skill Card, nie jest zablokowana przez moderację jako malware, a weryfikacja ClawScan jest czysta.
- Tożsamość skillu, tożsamość wydawcy i metadane wybranej wersji są polami koperty najwyższego poziomu (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), aby automatyzacja powłoki mogła je odczytać bez rozpakowywania zagnieżdżonych wrapperów.
- `security` to najwyższego poziomu werdykt ClawScan/bezpieczeństwa. Automatyzacja powinna opierać się na `ok`, `decision`, `reasons` i `security.status`.
- `security.signals` zawiera pomocnicze dowody ze skanerów, takie jak `staticScan`, `virusTotal` i `skillSpector`.
- `security.signals.dependencyRegistry` jest zachowane dla zgodności odpowiedzi v1, ale skaner istnienia rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- `provenance` ma wartość `server-resolved-github-import` tylko wtedy, gdy ClawHub rozwiązał i zapisał repozytorium/ref/commit/ścieżkę GitHub podczas publikacji lub importu; w przeciwnym razie ma wartość `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Zwraca bieżące kompaktowe werdykty bezpieczeństwa dla dokładnych wersji skilli. Ten
punkt końcowy kolekcji jest przeznaczony dla klientów, którzy już wiedzą, które zainstalowane
wersje skilli ClawHub muszą wyświetlić, takich jak OpenClaw Control UI.

Żądanie:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Uwagi:

- `items` musi zawierać 1-100 unikalnych par `{ slug, version }`.
- Wyniki są zwracane dla każdego elementu; jeden brakujący skill lub wersja nie powoduje niepowodzenia całej odpowiedzi.
- Odpowiedź dotyczy wyłącznie bezpieczeństwa. Nie zawiera danych Skill Card, stanu wygenerowanej karty, list plików artefaktów ani szczegółowych ładunków skanerów.
- `security.signals` zawiera tylko pomocnicze dowody na poziomie stanu; użyj `/scan` lub strony audytu bezpieczeństwa ClawHub, aby uzyskać pełne szczegóły skanerów.
- `security.signals.dependencyRegistry` jest zachowane dla zgodności odpowiedzi v1, ale skaner istnienia rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- Brak Skill Card nie wpływa na wartości `ok`, `decision` ani `reasons` tego punktu końcowego; klienci powinni czytać lokalnie zainstalowany `skill-card.md`, gdy potrzebują treści karty.
- Użyj `/verify`, gdy potrzebujesz koperty weryfikacji Skill Card pojedynczego skillu, `/card`, gdy potrzebujesz wygenerowanego Markdown karty, oraz `/scan`, gdy potrzebujesz szczegółowych danych skanerów.

Odpowiedź:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Zwraca surową treść tekstową.

Parametry zapytania:

- `path` (wymagany)
- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszej wersji.
- Limit rozmiaru pliku: 200 KB.

### `GET /api/v1/packages`

Ujednolicony endpoint katalogu dla:

- Skills
- pluginów kodu
- pluginów pakietowych

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–100)
- `cursor` (opcjonalny): kursor paginacji
- `family` (opcjonalny): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalny): `official`, `community` lub `private`
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `updated` (domyślnie), `recommended`, `trending`, `downloads`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest ograniczone do pakietów pluginów (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` lub endpointów pakietów z
  `family=code-plugin`/`family=bundle-plugin`). Kontrolowane kategorie i
  starsze aliasy filtrów v1 są udokumentowane w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości dla `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` lub `sort` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami o stałej rodzinie.
- Wpisy Skills nadal opierają się na rejestrze Skills i wciąż mogą być publikowane tylko przez `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy tylko do wydań pluginów kodu i pluginów pakietowych.
- Wywołujący anonimowi widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą widzieć pakiety prywatne wydawców, do których należą, w wynikach list/wyszukiwania.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie katalogu w Skills i pakietach pluginów.

Parametry zapytania:

- `q` (wymagany): ciąg zapytania
- `limit` (opcjonalny): liczba całkowita (1–100)
- `family` (opcjonalny): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalny): `official`, `community` lub `private`
- `isOfficial` (opcjonalny): `true` lub `false`
- `category` (opcjonalny): filtr kategorii pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest ograniczone do pakietów pluginów. Kontrolowane kategorie i starsze aliasy
  filtrów v1 są udokumentowane w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości dla `family`, `channel`, `isOfficial`, `featured` lub
  `highlightedOnly` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- Wywołujący anonimowi widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać pakiety prywatne wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/plugins`

Przeglądanie katalogu wyłącznie pluginów, obejmujące pakiety code-plugin i bundle-plugin.

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor paginacji
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `recommended` (domyślnie), `trending`, `downloads`, `updated`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii pluginów. Bieżące wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Starsze aliasy filtrów v1 pozostają akceptowane w endpointach odczytu:

- `mcp-tooling`, `data` i `automation` są rozwiązywane jako `tools`.
- `observability` i `deployment` są rozwiązywane jako `gateway`.
- `dev-tools` jest rozwiązywane jako `runtime`.

`trending` to siedmiodniowy ranking instalacji/pobrań i nie używa łącznych wartości z całego czasu.
W ujednoliconym endpoincie `/api/v1/packages` dotyczy tylko pluginów; użyj
`/api/v1/skills?sort=trending` dla katalogu Skills.

Starsze aliasy nie są akceptowane jako przechowywane ani deklarowane przez autora wartości kategorii.

### `GET /api/v1/skills/export`

Masowy eksport najnowszych publicznych Skills do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagany): dolna granica w milisekundach Unix dla `updatedAt` Skills.
- `endDate` (wymagany): górna granica w milisekundach Unix dla `updatedAt` Skills.
- `limit` (opcjonalny): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalny): kursor paginacji z poprzedniej odpowiedzi.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Skills jest zakorzeniony w `{publisher}/{slug}/`.
- Hostowane Skills zawierają pliki najnowszej zapisanej wersji i są wymienione w
  `_manifest.json` z `sourceRef: "public-clawhub"`.
- Bieżące Skills oparte na GitHubie ze skanem `clean` lub `suspicious` zawierają
  `_source_handoff.json` z `sourceRef: "public-github"`, repozytorium, commitem, ścieżką,
  skrótem treści i adresem URL archiwum. Nie zawierają plików źródłowych hostowanych przez ClawHub.
- Każdy Skills zawiera `_export_skill_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym ZIP.
- `_errors.json` jest dołączany, gdy poszczególnych Skills lub plików nie udało się
  wyeksportować.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Masowy eksport najnowszych publicznych wydań Pluginów do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagane): dolna granica w milisekundach Unix dla `updatedAt` Pluginu.
- `endDate` (wymagane): górna granica w milisekundach Unix dla `updatedAt` Pluginu.
- `limit` (opcjonalne): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalne): kursor paginacji z poprzedniej odpowiedzi.
- `family` (opcjonalne): `code-plugin` lub `bundle-plugin`. Pominięcie oznacza obie
  rodziny Pluginów.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Plugin ma katalog główny w `{family}/{packageName}/`.
- Każdy wyeksportowany Plugin zawiera zapisane pliki z najnowszego wydania.
- Metadane eksportu dla poszczególnych Pluginów są przechowywane w
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych Pluginów lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Wyszukiwanie wyłącznie Pluginów w pakietach code-plugin i bundle-plugin.

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita (1-100)
- `isOfficial` (opcjonalne): `true` lub `false`
- `category` (opcjonalne): filtr kategorii Pluginu. Aktualne wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Uwagi:

- Starsze aliasy filtrów v1 udokumentowane w sekcji `GET /api/v1/plugins` są również
  akceptowane.
- Filtrowanie kategorii jest rzeczywistym filtrem API opartym na wierszach skrótu kategorii Pluginów,
  a nie przepisaniem zapytania wyszukiwania.
- Wyniki są zwracane w kolejności trafności i obecnie nie są paginowane.
- Kontrolki sortowania w interfejsie przeglądarki dla wyszukiwania Pluginów zmieniają kolejność załadowanych wyników trafności,
  zgodnie z bieżącym zachowaniem przeglądania `/skills`.

### `GET /api/v1/packages/{name}`

Zwraca metadane szczegółów pakietu.

Uwagi:

- Skills mogą być również rozwiązywane przez tę trasę w ujednoliconym katalogu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `DELETE /api/v1/packages/{name}`

Miękko usuwa pakiet i wszystkie wydania.

Uwagi:

- Wymaga tokenu API właściciela pakietu, właściciela/administratora wydawcy organizacji,
  moderatora platformy lub administratora platformy.

### `GET /api/v1/packages/{name}/versions`

Zwraca historię wersji.

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–100)
- `cursor` (opcjonalne): kursor paginacji

Uwagi:

- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/versions/{version}`

Zwraca jedną wersję pakietu, w tym metadane plików, zgodność,
weryfikację, metadane artefaktu i dane skanowania.

Uwagi:

- `version.artifact.kind` ma wartość `legacy-zip` dla archiwów pakietów starego typu lub
  `npm-pack` dla wydań opartych na ClawPack.
- Wydania ClawPack zawierają pola zgodne z npm: `npmIntegrity`, `npmShasum` i
  `npmTarballName`.
- `version.sha256hash` to przestarzałe metadane zgodności dla starszych klientów. Haszuje
  dokładne bajty ZIP zwracane przez `/api/v1/packages/{name}/download`.
  Nowoczesne klienty powinny używać `version.artifact.sha256`, które identyfikuje
  kanoniczny artefakt wydania.
- `version.vtAnalysis`, `version.llmAnalysis` i `version.staticScan` są
  dołączane, gdy istnieją dane skanowania.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Zwraca dokładne podsumowanie bezpieczeństwa i zaufania dla wydania pakietu na potrzeby
klientów instalacyjnych. To publiczna powierzchnia użycia OpenClaw do podejmowania decyzji, czy
rozwiązane wydanie może zostać zainstalowane.

Uwierzytelnianie:

- Publiczny punkt końcowy odczytu. Token właściciela, wydawcy, moderatora ani administratora
  nie jest wymagany.

Odpowiedź:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Pola odpowiedzi:

- `package.name`, `package.displayName` i `package.family` identyfikują
  rozwiązany pakiet rejestru.
- `release.releaseId`, `release.version` i `release.createdAt` identyfikują
  dokładne wydanie, które oceniono.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` i `release.npmTarballName` są obecne, gdy są znane dla
  artefaktu wydania.
- `trust.scanStatus` to efektywny status zaufania wyprowadzony z danych wejściowych skanera
  i ręcznej moderacji wydania.
- `trust.moderationState` może mieć wartość null. Ma wartość `null`, gdy nie istnieje ręczna
  moderacja wydania.
- `trust.blockedFromDownload` to sygnał blokady instalacji. OpenClaw i inne
  klienty instalacyjne powinny blokować instalację, gdy ta wartość wynosi `true`, zamiast
  ponownie wyprowadzać reguły blokowania z pól skanera lub moderacji.
- `trust.reasons` to lista wyjaśnień dla użytkownika i audytu. Kody powodów
  są stabilnymi, zwartymi ciągami, takimi jak `manual:quarantined`, `scan:malicious`
  i `package:malicious`.
- `trust.pending` oznacza, że jedno lub więcej wejść zaufania nadal oczekuje na ukończenie.
- `trust.stale` oznacza, że podsumowanie zaufania obliczono na podstawie nieaktualnych danych wejściowych i
  powinno być traktowane jako wymagające odświeżenia przed decyzją o zezwoleniu o wysokiej pewności.

Uwagi:

- Ten punkt końcowy jest dokładny dla wersji. Klienty powinny wywoływać go po rozwiązaniu
  wersji pakietu, którą zamierzają zainstalować, a nie tylko po odczytaniu najnowszych
  metadanych pakietu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.
- Ten punkt końcowy jest celowo węższy niż punkty końcowe moderacji właściciela/moderatora.
  Udostępnia decyzję instalacyjną i publiczne wyjaśnienie, a nie
  tożsamości zgłaszających, treści zgłoszeń, prywatne dowody ani wewnętrzne
  osie czasu przeglądu.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane resolvera artefaktu dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` i starszy adres ZIP
  `downloadUrl`.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm,
  `tarballUrl` oraz starszy adres zgodności ZIP.
- To powierzchnia resolvera OpenClaw; pozwala uniknąć zgadywania formatu archiwum na podstawie
  współdzielonego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji przez jawną ścieżkę resolvera.

Uwagi:

- Wersje ClawPack strumieniują dokładne przesłane bajty `.tgz` npm-pack.
- Starsze wersje ZIP przekierowują do `/api/v1/packages/{name}/download?version=`.
- Używa zasobnika limitu szybkości pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczoną gotowość do przyszłego użycia przez OpenClaw.

Kontrole gotowości obejmują:

- oficjalny status kanału
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

Punkt końcowy moderatora do listowania wierszy migracji oficjalnych Pluginów OpenClaw.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora lub administratora.

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

Punkt końcowy administratora do tworzenia lub aktualizowania wiersza migracji oficjalnego Pluginu.

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
- `packageName` jest normalizowany jako nazwa npm; pakiet może nie istnieć dla planowanych
  migracji.
- To śledzi wyłącznie gotowość migracji. Nie modyfikuje OpenClaw ani nie generuje
  ClawPacków.

### `GET /api/v1/packages/moderation/queue`

Punkt końcowy moderatora/administratora dla kolejek przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora lub administratora.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `blocked`, `manual` lub `all`
- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji

Znaczenia statusów:

- `open`: podejrzane, złośliwe, oczekujące, objęte kwarantanną, unieważnione lub zgłoszone wydania.
- `blocked`: wydania objęte kwarantanną, unieważnione lub złośliwe.
- `manual`: każde wydanie z ręcznym nadpisaniem moderacji.
- `all`: każde wydanie z ręcznym nadpisaniem, nieczystym stanem skanowania lub zgłoszeniem pakietu.

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
  administratora.

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

Punkt końcowy moderatora/administratora do przeglądu wydania pakietu.

Żądanie:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Obsługiwane stany:

- `approved`: ręcznie sprawdzone i dozwolone.
- `quarantined`: zablokowane do czasu dalszych działań.
- `revoked`: zablokowane po tym, jak wydanie było wcześniej zaufane.

Wydania poddane kwarantannie i unieważnione zwracają `403` z tras pobierania artefaktów.
Każda zmiana zapisuje wpis w dzienniku audytu.

### `GET /api/v1/packages/{name}/file`

Zwraca surową treść tekstową pliku pakietu.

Parametry zapytania:

- `path` (wymagane)
- `version` (opcjonalnie)
- `tag` (opcjonalnie)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Używa limitu szybkości odczytu, a nie limitu pobierania.
- Pliki binarne zwracają `415`.
- Limit rozmiaru pliku: 200 KB.
- Oczekujące skany VirusTotal nie blokują odczytów; złośliwe wydania mogą nadal być wstrzymane gdzie indziej.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze deterministyczne archiwum ZIP dla wydania pakietu.

Parametry zapytania:

- `version` (opcjonalnie)
- `tag` (opcjonalnie)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa Plugin/pakietów są plikami zip z katalogiem głównym `package/`, aby starsi klienci OpenClaw
  nadal działały.
- Ta trasa pozostaje wyłącznie ZIP. Nie strumieniuje plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` oraz
  `X-ClawHub-Artifact-Sha256` na potrzeby sprawdzania integralności przez resolver.
- Metadane dostępne tylko w rejestrze nie są wstrzykiwane do pobranego archiwum.
- Oczekujące skany VirusTotal nie blokują pobrań; złośliwe wydania zwracają `403`.
- Pakiety prywatne zwracają `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca zgodny z npm packument dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wyświetlane są tylko wersje z przesłanymi tarballami ClawPack npm-pack.
- Starsze wersje wyłącznie ZIP są celowo pomijane.
- `dist.tarball`, `dist.integrity` i `dist.shasum` używają pól zgodnych z npm,
  aby użytkownicy mogli wskazać npm na mirror, jeśli tak wybiorą.
- Packumenty pakietów z zakresem obsługują zarówno `/api/npm/@scope/name`, jak i
  zakodowaną ścieżkę żądania npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Strumieniuje dokładne bajty przesłanego tarballa ClawPack dla klientów mirrora npm.

Uwagi:

- Używa limitu szybkości pobierania.
- Nagłówki pobierania zawierają ClawHub SHA-256 oraz metadane npm integrity/shasum.
- Nadal obowiązują sprawdzenia moderacji i dostępu do pakietów prywatnych.

### `GET /api/v1/resolve`

Używane przez CLI do mapowania lokalnego odcisku na znaną wersję.

Parametry zapytania:

- `slug` (wymagane)
- `hash` (wymagane): 64-znakowy szesnastkowy sha256 odcisku pakietu

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera hostowaną wersję Skills jako ZIP albo zwraca przekazanie do źródła GitHub dla
bieżącego Skills opartego na GitHub ze skanem `clean` lub `suspicious` i bez hostowanej
wersji.

Parametry zapytania:

- `slug` (wymagane)
- `version` (opcjonalnie): ciąg semver
- `tag` (opcjonalnie): nazwa tagu (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Wersje usunięte miękko zwracają `410`.
- Przekazania Skills opartego na GitHub nie pośredniczą ani nie mirrorują bajtów. Odpowiedź JSON
  zawiera `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  i `archiveUrl`; stan skanu/bieżący jest bramką i nie jest uwzględniany jako metadane
  ładunku sukcesu.
- Statystyki pobrań są liczone jako unikalne tożsamości na dzień UTC (`userId`, gdy token API jest ważny, w przeciwnym razie IP).

## Punkty końcowe uwierzytelniania (token Bearer)

Wszystkie punkty końcowe wymagają:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Waliduje token i zwraca uchwyt użytkownika.

### `POST /api/v1/skills`

Publikuje nową wersję.

- Preferowane: `multipart/form-data` z JSON `payload` + blobami `files[]`.
- Akceptowane jest także ciało JSON z `files` (oparte na storageId).
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, API rozwiązuje tego
  wydawcę po stronie serwera i wymaga, aby aktor miał dostęp do wydawcy.
- Opcjonalne pole ładunku: `migrateOwner`. Gdy ma wartość `true` z `ownerHandle`,
  istniejący Skills może zostać przeniesiony do tego właściciela, jeśli aktor jest administratorem/właścicielem zarówno u
  bieżącego, jak i docelowego wydawcy. Bez tej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie code-plugin lub bundle-plugin.

- Wymaga uwierzytelniania tokenem Bearer.
- Wymaga `multipart/form-data`.
- Dozwolone pola formularza to `payload`, powtarzane bloby `files` albo jedna referencja tarballa `clawpack`.
  `clawpack` może być blobem `.tgz` albo identyfikatorem storage zwróconym przez
  przepływ upload-url. Publikacje z przygotowanym storage-id muszą także zawierać
  `clawpackUploadTicket` zwrócony z tym adresem URL przesyłania.
- Użyj albo `files`, albo `clawpack`, nigdy obu w tym samym żądaniu.
- Ciała JSON i dostarczone przez wywołującego metadane `payload.files` / `payload.artifact`
  są odrzucane.
- Bezpośrednie żądania publikacji multipart są ograniczone do 18 MB. Tarballe ClawPack mogą
  używać przepływu upload-url do limitu tarballa 120 MB.
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze elementy walidacji:

- `family` musi być `code-plugin` lub `bundle-plugin`.
- Pakiety Plugin wymagają `openclaw.plugin.json`. Przesyłane pliki ClawPack `.tgz` muszą
  zawierać go w `package/openclaw.plugin.json`.
- Pluginy kodu wymagają `package.json`, metadanych repozytorium źródłowego, metadanych commita źródłowego,
  metadanych schematu konfiguracji, `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` są opcjonalnymi metadanymi.
- Tylko wydawca organizacji `openclaw` oraz osobiści wydawcy bieżących członków organizacji `openclaw`
  mogą publikować w kanale `official`.
- Publikacje w czyimś imieniu nadal walidują kwalifikowalność do kanału oficjalnego względem docelowego konta właściciela.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękkie usunięcie / przywrócenie Skills (właściciel, moderator lub administrator).

Opcjonalne ciało JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Gdy jest obecne, `reason` jest przechowywany jako notatka moderacyjna Skills i kopiowany do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni, po czym slug może zostać przejęty przez
innego wydawcę. Odpowiedź usunięcia zawiera `slugReservedUntil`, gdy ten termin wygaśnięcia ma zastosowanie.
Ukrycia przez moderatora/administratora i usunięcia bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź usunięcia:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kody stanu:

- `200`: ok
- `401`: nieuwierzytelniony
- `403`: zabronione
- `404`: nie znaleziono Skills/użytkownika
- `500`: wewnętrzny błąd serwera

### `POST /api/v1/users/publisher`

Tylko administrator. Zapewnia istnienie wydawcy organizacji dla uchwytu. Jeśli uchwyt nadal wskazuje na
starszego współdzielonego użytkownika/osobistego wydawcę, punkt końcowy najpierw migruje go do wydawcy organizacji.
Dla nowo utworzonej organizacji podaj `memberHandle`; działający administrator nie jest dodawany jako członek.
`memberRole` domyślnie ma wartość `owner`.

- Ciało: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Uwierzytelnione samoobsługowe tworzenie wydawcy organizacji. Tworzy nowego wydawcę organizacji i dodaje
wywołującego jako właściciela. Ten punkt końcowy nie migruje istniejących uchwytów użytkowników/osobistych i nie
oznacza wydawcy jako zaufanego/oficjalnego.

- Ciało: `{ "handle": "opik", "displayName": "Opik" }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Zwraca `409`, gdy uchwyt jest już używany przez wydawcę, użytkownika lub osobistego wydawcę.

### `POST /api/v1/users/reserve`

Tylko administrator. Rezerwuje główne slugi i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, dzięki czemu ten sam
właściciel może później opublikować rzeczywiste wydanie code-plugin lub bundle-plugin pod tą nazwą.

- Ciało: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Tylko administrator. Odzyskuje osobistego wydawcę dla zweryfikowanej zastępczej tożsamości GitHub OAuth
bez edytowania wierszy kont Convex Auth. Żądanie musi wskazywać oba niezmienne identyfikatory konta
dostawcy GitHub; zmienne uchwyty są używane wyłącznie jako zabezpieczenie widoczne dla operatora.

Punkt końcowy domyślnie działa w trybie próbnym. Zastosowanie odzyskiwania wymaga `dryRun: false` oraz
`confirmIdentityVerified: true` po niezależnym zweryfikowaniu przez personel ciągłości między oboma
podmiotami GitHub. Odzyskiwanie odmawia działania w stanie bezpiecznym, gdy bieżący osobisty
wydawca użytkownika docelowego ma skills, pakiety lub źródła skills GitHub.
Odzyskiwanie migruje także starsze pola `ownerUserId` dla skills odzyskiwanego wydawcy,
aliasów slugów skills, pakietów, ostrzeżeń inspektora pakietów oraz pochodnych wierszy skrótu wyszukiwania, aby
ścieżki bezpośredniego właściciela były zgodne z nowym autorytetem wydawcy. Aktywna rezerwacja
chronionego identyfikatora dla odzyskiwanego identyfikatora jest także przypisywana użytkownikowi zastępczemu, aby późniejsza
synchronizacja profilu nie mogła przywrócić konkurencyjnego autorytetu poprzedniego użytkownika. Każda tabela podstawowa jest ograniczona do
100 wierszy na transakcję zastosowania; większe odzyskiwania muszą najpierw użyć wznawialnej migracji właściciela.
Źródła skills GitHub mają zakres wydawcy i są raportowane jako sprawdzone, a nie przepisywane.

- Treść: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Odpowiedź: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Punkty końcowe zarządzania slugami właściciela

- `POST /api/v1/skills/{slug}/rename`
  - Treść: `{ "newSlug": "new-canonical-slug" }`
  - Odpowiedź: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Treść: `{ "targetSlug": "canonical-target-slug" }`
  - Odpowiedź: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Uwagi:

- Oba punkty końcowe wymagają uwierzytelniania tokenem API i działają tylko dla właściciela skill.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje slug źródłowy do wpisu docelowego.

### Punkty końcowe przenoszenia własności

- `POST /api/v1/skills/{slug}/transfer`
  - Treść: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Odpowiedź: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Odpowiedź (zaakceptowanie/odrzucenie/anulowanie): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Kształt odpowiedzi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Zablokuj użytkownika i trwale usuń należące do niego skills (tylko moderator/admin).

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

Odblokuj użytkownika i przywróć kwalifikujące się skills (tylko admin).

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

### `POST /api/v1/users/reclassify-ban`

Zmień zapisaną przyczynę istniejącej blokady bez odblokowywania ani przywracania
treści (tylko admin). Domyślnie działa w trybie próbnym, chyba że `dryRun` ma wartość `false`.

Treść:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

lub

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Odpowiedź:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Zmień rolę użytkownika (tylko admin).

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

Wyświetl lub wyszukaj użytkowników (tylko admin).

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

Dodaj/usuń gwiazdkę (wyróżnienia). Oba punkty końcowe są idempotentne.

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
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Plan usunięcia znajduje się w `DEPRECATIONS.md`.

`POST /api/cli/upload-url` zwraca `uploadUrl` i `uploadTicket`. Publikacje pakietów,
które przygotowują archiwum tar ClawPack, muszą wysłać wynikowy identyfikator magazynu jako
`clawpack`, a zwrócony bilet jako `clawpackUploadTicket`.

## Wykrywanie rejestru (`/.well-known/clawhub.json`)

CLI może wykrywać ustawienia rejestru/uwierzytelniania z witryny:

- `/.well-known/clawhub.json` (JSON, preferowane)
- `/.well-known/clawdhub.json` (starsze)

Schemat:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Jeśli hostujesz samodzielnie, udostępnij ten plik (lub ustaw jawnie `CLAWHUB_REGISTRY`; starsze `CLAWDHUB_REGISTRY`).
