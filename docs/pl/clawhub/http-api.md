---
read_when:
    - Dodawanie/zmienianie punktów końcowych
    - Debugowanie żądań CLI ↔ rejestr
summary: Dokumentacja referencyjna HTTP API (publiczne + punkty końcowe CLI + uwierzytelnianie).
x-i18n:
    generated_at: "2026-07-02T17:47:01Z"
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

## Ponowne użycie katalogu publicznego

Katalogi firm trzecich mogą używać publicznych punktów końcowych odczytu do wyświetlania lub wyszukiwania Skills ClawHub. Buforuj wyniki, respektuj `429`/`Retry-After`, kieruj użytkowników z powrotem do kanonicznej listy ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) i unikaj sugerowania, że ClawHub popiera witrynę firmy trzeciej. Nie próbuj odzwierciedlać ukrytych, prywatnych ani zablokowanych przez moderację treści poza publiczną powierzchnią API.

Skróty slugów webowych są rozwiązywane między rodzinami rejestru, ale klienci API powinni używać
kanonicznych URL-i zwracanych przez punkty końcowe odczytu zamiast rekonstruować pierwszeństwo
tras.

## Limity szybkości

Model egzekwowania:

- Żądania anonimowe: egzekwowane per IP.
- Żądania uwierzytelnione (ważny token Bearer): egzekwowane per koszyk użytkownika.
- Jeśli tokenu brakuje albo jest nieprawidłowy, zachowanie wraca do egzekwowania per IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać gołego `Unauthorized`, gdy
  serwer zna przyczynę. Brakujące tokeny, nieprawidłowe/unieważnione tokeny oraz
  usunięte/zbanowane/wyłączone konta powinny otrzymywać tekst umożliwiający działanie, aby klienci
  CLI mogli powiedzieć użytkownikom, co ich zablokowało.

- Odczyt: 3000/min per IP, 12000/min per klucz
- Zapis: 300/min per IP, 3000/min per klucz
- Pobieranie: 1200/min per IP, 6000/min per klucz (punkty końcowe pobierania)

Nagłówki:

- Zgodność ze starszymi wersjami: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Ustandaryzowane: `RateLimit-Limit`, `RateLimit-Reset`
- Przy `429`: `X-RateLimit-Remaining: 0` i `RateLimit-Remaining: 0`
- Przy `429`: `Retry-After`

Semantyka nagłówków:

- `X-RateLimit-Reset`: bezwzględne sekundy epoki Unix
- `RateLimit-Reset`: sekundy do zresetowania (opóźnienie)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały budżet, gdy występuje.
  Podzielone na fragmenty zakończone powodzeniem żądania pomijają ten nagłówek zamiast zwracać przybliżoną wartość globalną.
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

Wskazówki dla klientów:

- Jeśli istnieje `Retry-After`, poczekaj tyle sekund przed ponowną próbą.
- Używaj backoffu z jitterem, aby uniknąć zsynchronizowanych ponowień.
- Jeśli brakuje `Retry-After`, wróć do `RateLimit-Reset` (albo oblicz z `X-RateLimit-Reset`).

Źródło IP:

- Używa zaufanych nagłówków IP klienta, w tym `cf-connecting-ip`, tylko gdy
  wdrożenie jawnie włącza zaufane przekazane nagłówki.
- ClawHub używa zaufanych nagłówków przekazywania do identyfikowania IP klientów na krawędzi.
- Jeśli zaufany IP klienta nie jest dostępny, żądania anonimowe używają koszyków awaryjnych
  ograniczonych tylko do rodzaju limitu szybkości. Te koszyki awaryjne nie obejmują
  ścieżek, slugów, nazw pakietów, wersji, ciągów zapytań ani innych
  parametrów artefaktów podanych przez wywołującego.

## Odpowiedzi błędów

Publiczne odpowiedzi błędów v1 są zwykłym tekstem z `content-type: text/plain; charset=utf-8`.
Obejmuje to niepowodzenia walidacji (`400`), brakujące zasoby publiczne (`404`), niepowodzenia uwierzytelniania i
uprawnień (`401`/`403`), limity szybkości (`429`) oraz zablokowane pobrania. Klienci
powinni odczytywać treść odpowiedzi jako czytelny dla człowieka ciąg znaków. Nieznane parametry zapytania są
ignorowane dla zgodności, ale rozpoznane parametry zapytania z nieprawidłowymi wartościami zwracają
`400`.

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

- Wyniki są zwracane w kolejności trafności (podobieństwo embeddingów + dokładne wzmocnienia tokenów sluga/nazwy + niewielki priorytet popularności).
- Trafność jest silniejsza niż popularność. Precyzyjne dopasowanie tokenu sluga albo nazwy wyświetlanej może wyprzedzić luźniejsze dopasowanie z dużo silniejszym zaangażowaniem.
- Tekst ASCII jest tokenizowany na granicach słów i interpunkcji. Na przykład `personal-map` zawiera samodzielny token `map`, podczas gdy `amap-jsapi-skill` zawiera `amap`, `jsapi` i `skill`; wyszukiwanie `map` daje więc `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Popularność jest skalowana logarytmicznie i ograniczona. Skills o wysokim zaangażowaniu mogą mieć niższą pozycję, gdy tekst zapytania jest słabiej dopasowany.
- Podejrzany albo ukryty stan moderacji może usunąć Skill z publicznego wyszukiwania w zależności od filtrów wywołującego i bieżącego statusu moderacji.

Wskazówki dotyczące wykrywalności dla wydawców:

- Umieść terminy, których użytkownicy będą dosłownie szukać, w nazwie wyświetlanej, podsumowaniu i tagach. Użyj samodzielnego tokenu sluga tylko wtedy, gdy jest on także stabilną tożsamością, którą chcesz zachować.
- Nie zmieniaj nazwy sluga tylko po to, aby ścigać jedno zapytanie, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny URL, wyświetlany slug i przyszłe skróty wyszukiwania używają nowego sluga.
- Aliasy zmiany nazwy zachowują rozwiązywanie dla starych URL-i i instalacji, które rozwiązują przez rejestr, ale ranking wyszukiwania opiera się na kanonicznych metadanych Skill po zaindeksowaniu zmiany nazwy. Istniejące statystyki pozostają przy Skill.
- Jeśli Skill jest nieoczekiwanie niewidoczny, najpierw sprawdź stan moderacji za pomocą `clawhub inspect @owner/slug` po zalogowaniu, zanim zmienisz metadane związane z rankingiem.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–200)
- `cursor` (opcjonalne): kursor paginacji dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalne): `updated` (domyślnie), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` mapują na `downloads`, `trending`
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalne): starszy alias dla `nonSuspiciousOnly`

Nieprawidłowe wartości `sort` zwracają `400`.

Uwagi:

- `recommended` używa sygnałów zaangażowania i aktualności.
- `trending` klasyfikuje według instalacji z ostatnich 7 dni (na podstawie telemetrii).
- `createdAt` jest stabilne dla przeszukiwań nowych Skills; `updated` zmienia się, gdy istniejące Skills są publikowane ponownie.
- Gdy `nonSuspiciousOnly=true`, sortowania oparte na kursorze mogą zwrócić mniej niż `limit` elementów na stronie, ponieważ podejrzane Skills są filtrowane po pobraniu strony.
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

- Stare slugi utworzone przez przepływy zmiany nazwy/scalenia właściciela rozwiązują się do kanonicznego Skill.
- `metadata.os`: ograniczenia OS zadeklarowane we frontmatter Skill (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata.systems`: cele systemów Nix (np. `["aarch64-darwin", "x86_64-linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata` to `null`, jeśli Skill nie ma metadanych platformy.
- `moderation` jest uwzględnione tylko wtedy, gdy Skill jest oflagowany albo właściciel go przegląda.

### `GET /api/v1/skills/{slug}/moderation`

Zwraca strukturalny stan moderacji.

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

- Właściciele i moderatorzy mogą uzyskać dostęp do szczegółów moderacji dla ukrytych Skills.
- Publiczni wywołujący otrzymują `200` tylko dla już oflagowanych widocznych Skills.
- Materiał dowodowy jest redagowany dla publicznych wywołujących i zawiera surowe fragmenty tylko dla właścicieli/moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłoś Skill do przeglądu przez moderatora. Zgłoszenia są na poziomie Skill, opcjonalnie połączone
z wersją i zasilają kolejkę zgłoszeń Skill.

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
ustawiania `status` z powrotem na `open`. Przekaż `finalAction: "hide"` z triagowanym
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
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wygenerował jednoznaczny werdykt (`clean`, `suspicious` lub `malicious`).
- `moderation` to bieżąca migawka moderacji na poziomie Skills, wyprowadzona z najnowszej wersji.
- Podczas odpytywania wersji historycznej sprawdź `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim potraktujesz `moderation` i `security` jako ten sam kontekst wersji.

### `POST /api/v1/skills/-/scan`

Uwierzytelniony endpoint przesyłania nowych zadań ClawScan.

Lokalne skany przesyłanych plików nie są już obsługiwane. Żądania używające
`multipart/form-data` lub `{ "source": { "kind": "upload" } }` zwracają `410`.

Skany opublikowanych zasobów używają JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Uwagi:

- Ładunki żądań skanowania i raporty do pobrania wygasają z magazynu żądań skanowania po upływie okna retencji.
- Skany opublikowanych zasobów wymagają dostępu właściciela/wydawcy do zarządzania albo uprawnień moderatora/administratora platformy.
- Skany opublikowanych zasobów zapisują wyniki z powrotem tylko wtedy, gdy `update: true` i skan zakończy się powodzeniem.
- Odpowiedź to `202` z `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Zadania skanowania są asynchroniczne. Ręczne żądania skanowania mają priorytet przed zwykłą pracą publikowania/uzupełniania, ale ukończenie nadal zależy od dostępności workerów.

### `GET /api/v1/skills/-/scan/{scanId}`

Uwierzytelniony endpoint odpytywania przesłanego skanu.

- Zwraca status queued/running/succeeded/failed.
- Zwraca `queue.queuedAhead` i `queue.position`, gdy zadanie jest w kolejce, aby klienci mogli pokazać, ile priorytetowych ręcznych skanów poprzedza żądanie. Bardzo duże kolejki są ograniczane i raportowane z `queuedAheadIsEstimate: true`.
- Gdy jest dostępny, `report` zawiera sekcje `clawscan`, `skillspector`, `staticAnalysis` i `virustotal`.
- Nieudane zadania skanowania zwracają `status: "failed"` z `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Uwierzytelniony endpoint archiwum raportu.

- Wymaga skanu zakończonego powodzeniem; skany nieterminalne zwracają `409`.
- Zwraca plik ZIP z `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` i `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Uwierzytelniony endpoint przechowywanego archiwum raportu dla przesłanych wersji.

- Wymaga dostępu właściciela/wydawcy do zarządzania Skills lub pluginem albo uprawnień moderatora/administratora platformy.
- Zwraca przechowywane wyniki skanowania dla dokładnej przesłanej wersji, w tym wersji zablokowanych lub ukrytych.
- `kind` domyślnie przyjmuje wartość `skill`; użyj `kind=plugin` dla skanów pluginów/pakietów.
- Zwraca ten sam kształt ZIP co pobrania żądań skanowania.

### `POST /api/v1/skills/-/scan/batch`

Kanonicalna trasa ponownego skanowania wsadowego tylko dla administratorów. Akceptuje ten sam kształt ładunku co starsze `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Kanonicalna trasa statusu wsadowego tylko dla administratorów. Akceptuje `{ "jobIds": ["..."] }` i zwraca te same zagregowane liczniki co starsze `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Zwraca kopertę weryfikacji Skill Card używaną przez `clawhub skill verify`.

Parametry zapytania:

- `version` (opcjonalnie): konkretny ciąg wersji.
- `tag` (opcjonalnie): rozwiązuje otagowaną wersję (na przykład `latest`).

Uwagi:

- `ok` ma wartość `true` tylko wtedy, gdy wybrana wersja ma wygenerowaną Skill Card, nie jest zablokowana przez moderację jako złośliwe oprogramowanie, a weryfikacja ClawScan jest czysta.
- Tożsamość Skills, tożsamość wydawcy i metadane wybranej wersji są polami koperty najwyższego poziomu (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), aby automatyzacja powłoki mogła je odczytać bez rozpakowywania zagnieżdżonych wrapperów.
- `security` to werdykt ClawScan/security najwyższego poziomu. Automatyzacja powinna opierać się na `ok`, `decision`, `reasons` i `security.status`.
- `security.signals` zawiera pomocnicze dowody skanerów, takie jak `staticScan`, `virusTotal` i `skillSpector`.
- `security.signals.dependencyRegistry` jest zachowane dla kompatybilności odpowiedzi v1, ale skaner istnienia rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- `provenance` ma wartość `server-resolved-github-import` tylko wtedy, gdy ClawHub rozwiązał i zapisał repo/ref/commit/path GitHub podczas publikowania lub importu; w przeciwnym razie ma wartość `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Zwraca bieżące kompaktowe werdykty bezpieczeństwa dla dokładnych wersji Skills. Ten
endpoint kolekcji jest przeznaczony dla klientów, którzy już wiedzą, które zainstalowane
wersje ClawHub Skills muszą wyświetlić, takich jak OpenClaw Control UI.

Żądanie:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Uwagi:

- `items` musi zawierać 1-100 unikalnych par `{ slug, version }`.
- Wyniki są per element; jeden brakujący Skills lub wersja nie powoduje niepowodzenia całej odpowiedzi.
- Odpowiedź dotyczy wyłącznie bezpieczeństwa. Nie obejmuje danych Skill Card, statusu wygenerowanej karty, list plików artefaktów ani szczegółowych ładunków skanerów.
- `security.signals` zawiera tylko dowody pomocnicze na poziomie statusu; użyj `/scan` lub strony audytu bezpieczeństwa ClawHub, aby uzyskać pełne szczegóły skanerów.
- `security.signals.dependencyRegistry` jest zachowane dla kompatybilności odpowiedzi v1, ale skaner istnienia rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- Brak Skill Card nie wpływa na `ok`, `decision` ani `reasons` tego endpointu; klienci powinni odczytywać lokalnie zainstalowany `skill-card.md`, gdy potrzebują treści karty.
- Użyj `/verify`, gdy potrzebujesz koperty weryfikacji Skill Card dla pojedynczego Skills, `/card`, gdy potrzebujesz wygenerowanego markdown karty, oraz `/scan`, gdy potrzebujesz szczegółowych danych skanera.

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

- `path` (wymagane)
- `version` (opcjonalne)
- `tag` (opcjonalne)

Uwagi:

- Domyślnie używa najnowszej wersji.
- Limit rozmiaru pliku: 200 KB.

### `GET /api/v1/packages`

Ujednolicony endpoint katalogu dla:

- Skills
- pluginów kodu
- pluginów pakietowych

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–100)
- `cursor` (opcjonalne): kursor paginacji
- `family` (opcjonalne): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalne): `official`, `community` lub `private`
- `isOfficial` (opcjonalne): `true` lub `false`
- `sort` (opcjonalne): `updated` (domyślnie), `recommended`, `trending`, `downloads`, starszy alias `installs`
- `category` (opcjonalne): filtr kategorii pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest zawężone do pakietów pluginów (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` lub endpointów pakietów z
  `family=code-plugin`/`family=bundle-plugin`). Kontrolowane kategorie i
  starsze aliasy filtrów v1 są udokumentowane pod `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` lub `sort` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami o stałej rodzinie.
- Wpisy Skills nadal są obsługiwane przez rejestr Skills i nadal mogą być publikowane tylko przez `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy tylko do wydań code-plugin i bundle-plugin.
- Anonimowi wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą widzieć prywatne pakiety wydawców, do których należą, w wynikach listy/wyszukiwania.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie katalogu w Skills i pakietach pluginów.

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita (1–100)
- `family` (opcjonalne): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalne): `official`, `community` lub `private`
- `isOfficial` (opcjonalne): `true` lub `false`
- `category` (opcjonalne): filtr kategorii pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest zawężone do pakietów pluginów. Kontrolowane kategorie i starsze aliasy
  filtrów v1 są udokumentowane pod `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości `family`, `channel`, `isOfficial`, `featured` lub
  `highlightedOnly` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- Anonimowi wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/plugins`

Przeglądanie katalogu tylko pluginów obejmujące pakiety code-plugin i bundle-plugin.

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji
- `isOfficial` (opcjonalne): `true` lub `false`
- `sort` (opcjonalne): `recommended` (domyślnie), `trending`, `downloads`, `updated`, starszy alias `installs`
- `category` (opcjonalne): filtr kategorii pluginów. Obecne wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Starsze aliasy filtrów v1 pozostają akceptowane na endpointach odczytu:

- `mcp-tooling`, `data` i `automation` rozwiązują się do `tools`.
- `observability` i `deployment` rozwiązują się do `gateway`.
- `dev-tools` rozwiązuje się do `runtime`.

`trending` to siedmiodniowa tabela liderów instalacji/pobrań i nie używa łącznych wartości z całego okresu.
Na ujednoliconym endpoincie `/api/v1/packages` dotyczy tylko pluginów; użyj
`/api/v1/skills?sort=trending` dla katalogu Skills.

Starsze aliasy nie są akceptowane jako przechowywane ani deklarowane przez autora wartości kategorii.

### `GET /api/v1/skills/export`

Masowy eksport najnowszych publicznych Skills do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagane): dolna granica w milisekundach Uniksa dla `updatedAt` Skills.
- `endDate` (wymagane): górna granica w milisekundach Uniksa dla `updatedAt` Skills.
- `limit` (opcjonalne): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalne): kursor paginacji z poprzedniej odpowiedzi.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Skill ma katalog główny w `{publisher}/{slug}/`.
- Hostowane Skills zawierają najnowsze przechowywane pliki wersji i są wymienione w
  `_manifest.json` z `sourceRef: "public-clawhub"`.
- Obecne Skills oparte na GitHub z wynikiem skanowania `clean` lub `suspicious` zawierają
  `_source_handoff.json` z `sourceRef: "public-github"`, repozytorium, commitem, ścieżką,
  hashem treści i URL-em archiwum. Nie zawierają plików źródłowych hostowanych w ClawHub.
- Każdy Skill zawiera `_export_skill_meta.json`.
- `_manifest.json` jest zawsze dołączony w katalogu głównym ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych Skills lub plików.

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
- `family` (opcjonalne): `code-plugin` albo `bundle-plugin`. Pominięcie oznacza obie
  rodziny Pluginów.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Plugin ma katalog główny w `{family}/{packageName}/`.
- Każdy wyeksportowany Plugin zawiera zapisane pliki najnowszego wydania.
- Metadane eksportu dla poszczególnych Pluginów są przechowywane w
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym ZIP.
- `_errors.json` jest dołączany, gdy nie można było wyeksportować poszczególnych Pluginów lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Wyszukiwanie tylko Pluginów w pakietach code-plugin i bundle-plugin.

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita (1-100)
- `isOfficial` (opcjonalne): `true` albo `false`
- `category` (opcjonalne): filtr kategorii Pluginu. Bieżące wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Uwagi:

- Starsze aliasy filtrów v1 udokumentowane w `GET /api/v1/plugins` są także
  akceptowane.
- Filtrowanie kategorii to rzeczywisty filtr API oparty na wierszach skrótu kategorii Pluginu,
  a nie przepisanie zapytania wyszukiwania.
- Wyniki są zwracane w kolejności trafności i obecnie nie są paginowane.
- Kontrolki sortowania interfejsu przeglądarki dla wyszukiwania Pluginów zmieniają kolejność wczytanych wyników trafności,
  zgodnie z bieżącym zachowaniem przeglądania `/skills`.

### `GET /api/v1/packages/{name}`

Zwraca metadane szczegółów pakietu.

Uwagi:

- Skills mogą być także rozpoznawane przez tę trasę w ujednoliconym katalogu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `DELETE /api/v1/packages/{name}`

Miękko usuwa pakiet i wszystkie wydania.

Uwagi:

- Wymaga tokenu API właściciela pakietu, właściciela/admina wydawcy organizacji,
  moderatora platformy albo administratora platformy.

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

- `version.artifact.kind` ma wartość `legacy-zip` dla archiwów pakietów starego świata albo
  `npm-pack` dla wydań opartych na ClawPack.
- Wydania ClawPack zawierają pola zgodne z npm: `npmIntegrity`, `npmShasum` i
  `npmTarballName`.
- `version.sha256hash` to przestarzałe metadane zgodności dla starych klientów. Hashuje
  dokładne bajty ZIP zwracane przez `/api/v1/packages/{name}/download`.
  Nowoczesni klienci powinni używać `version.artifact.sha256`, które identyfikuje
  kanoniczny artefakt wydania.
- `version.vtAnalysis`, `version.llmAnalysis` i `version.staticScan` są
  dołączane, gdy istnieją dane skanowania.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Zwraca dokładne podsumowanie bezpieczeństwa i zaufania wydania pakietu dla klientów
instalacyjnych. To publiczna powierzchnia konsumpcji OpenClaw służąca do podjęcia decyzji, czy
rozpoznane wydanie może zostać zainstalowane.

Uwierzytelnianie:

- Publiczny endpoint odczytu. Token właściciela, wydawcy, moderatora ani administratora nie jest
  wymagany.

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
  rozpoznany pakiet rejestru.
- `release.releaseId`, `release.version` i `release.createdAt` identyfikują
  dokładne wydanie, które zostało ocenione.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` i `release.npmTarballName` są obecne, gdy są znane dla
  artefaktu wydania.
- `trust.scanStatus` to efektywny status zaufania wyprowadzony z danych skanera
  i ręcznej moderacji wydania.
- `trust.moderationState` może być nullem. Ma wartość `null`, gdy nie istnieje ręczna
  moderacja wydania.
- `trust.blockedFromDownload` to sygnał blokady instalacji. OpenClaw i inni
  klienci instalacyjni powinni blokować instalację, gdy ta wartość to `true`, zamiast
  ponownie wyprowadzać reguły blokowania z pól skanera lub moderacji.
- `trust.reasons` to lista wyjaśnień dla użytkownika i audytu. Kody powodów
  są stabilnymi, zwięzłymi ciągami, takimi jak `manual:quarantined`, `scan:malicious`
  i `package:malicious`.
- `trust.pending` oznacza, że co najmniej jedno wejście zaufania nadal oczekuje na ukończenie.
- `trust.stale` oznacza, że podsumowanie zaufania zostało obliczone z nieaktualnych danych wejściowych i
  powinno być traktowane jako wymagające odświeżenia przed decyzją o zezwoleniu o wysokiej pewności.

Uwagi:

- Ten endpoint jest dokładny względem wersji. Klienci powinni wywołać go po rozpoznaniu
  wersji pakietu, którą zamierzają zainstalować, a nie tylko po odczytaniu najnowszych
  metadanych pakietu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.
- Ten endpoint jest celowo węższy niż endpointy moderacji właściciela/moderatora.
  Udostępnia decyzję instalacyjną i publiczne wyjaśnienie, a nie
  tożsamości zgłaszających, treść zgłoszeń, prywatne dowody ani wewnętrzne osie czasu
  przeglądu.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane resolvera artefaktu dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` i starszy adres ZIP
  `downloadUrl`.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm,
  `tarballUrl` i starszy adres URL zgodności ZIP.
- To powierzchnia resolvera OpenClaw; pozwala uniknąć zgadywania formatu archiwum na podstawie
  współdzielonego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji przez jawną ścieżkę resolvera.

Uwagi:

- Wersje ClawPack strumieniują dokładne przesłane bajty `.tgz` npm-pack.
- Starsze wersje ZIP przekierowują do `/api/v1/packages/{name}/download?version=`.
- Używa koszyka limitu szybkości pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczoną gotowość do przyszłej konsumpcji przez OpenClaw.

Kontrole gotowości obejmują:

- status oficjalnego kanału
- dostępność najnowszej wersji
- dostępność artefaktu ClawPack npm-pack
- skrót artefaktu
- pochodzenie repozytorium źródłowego i commita
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

Endpoint moderatora do listowania wierszy migracji oficjalnych Pluginów OpenClaw.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora albo administratora.

Parametry zapytania:

- `phase` (opcjonalne): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` albo
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

Endpoint administratora do tworzenia albo aktualizowania wiersza migracji oficjalnego Pluginu.

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
- To śledzi wyłącznie gotowość migracji. Nie mutuje OpenClaw ani nie generuje
  ClawPacków.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderatora/administratora dla kolejek przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora albo administratora.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `blocked`, `manual` albo `all`
- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji

Znaczenia statusów:

- `open`: podejrzane, złośliwe, oczekujące, poddane kwarantannie, odwołane albo zgłoszone wydania.
- `blocked`: poddane kwarantannie, odwołane albo złośliwe wydania.
- `manual`: dowolne wydanie z ręcznym nadpisaniem moderacji.
- `all`: dowolne wydanie z ręcznym nadpisaniem, nieczystym stanem skanowania albo zgłoszeniem pakietu.

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
nie blokują pobrań; moderatorzy powinni używać moderacji wydania do
zatwierdzania, poddawania kwarantannie albo odwoływania artefaktów.

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

Endpoint moderatora/administratora do przyjmowania zgłoszeń pakietów.

Uwierzytelnianie:

- Wymaga tokena API użytkownika z rolą moderatora lub administratora.

Parametry zapytania:

- `status` (opcjonalny): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor paginacji

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

Endpoint właściciela/moderatora do podglądu moderacji pakietu.

Uwierzytelnianie:

- Wymaga tokena API właściciela pakietu, członka wydawcy, moderatora lub
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

Endpoint moderatora/administratora do rozstrzygania lub ponownego otwierania zgłoszeń pakietów.

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
- `revoked`: zablokowane po wcześniejszym uznaniu wydania za zaufane.

Wydania poddane kwarantannie i unieważnione zwracają `403` z tras pobierania artefaktów.
Każda zmiana zapisuje wpis dziennika audytu.

### `GET /api/v1/packages/{name}/file`

Zwraca surową zawartość tekstową pliku pakietu.

Parametry zapytania:

- `path` (wymagany)
- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Używa limitu szybkości odczytu, a nie limitu pobierania.
- Pliki binarne zwracają `415`.
- Limit rozmiaru pliku: 200 KB.
- Oczekujące skany VirusTotal nie blokują odczytów; złośliwe wydania nadal mogą być wstrzymywane gdzie indziej.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze, deterministyczne archiwum ZIP dla wydania pakietu.

Parametry zapytania:

- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa Plugin/pakietów są plikami zip z katalogiem głównym `package/`, aby stare klienty OpenClaw
  nadal działały.
- Ta trasa pozostaje wyłącznie ZIP. Nie przesyła strumieniowo plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` i
  `X-ClawHub-Artifact-Sha256` do kontroli integralności resolvera.
- Metadane dostępne tylko w rejestrze nie są wstrzykiwane do pobranego archiwum.
- Oczekujące skany VirusTotal nie blokują pobrań; złośliwe wydania zwracają `403`.
- Pakiety prywatne zwracają `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca packument zgodny z npm dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wyświetlane są tylko wersje z przesłanymi tarballami ClawPack npm-pack.
- Starsze wersje wyłącznie ZIP są celowo pomijane.
- `dist.tarball`, `dist.integrity` i `dist.shasum` używają pól zgodnych z npm,
  aby użytkownicy mogli skierować npm na lustro, jeśli tak wybiorą.
- Packumenty pakietów zakresowych obsługują zarówno ścieżkę żądania `/api/npm/@scope/name`, jak i
  zakodowaną ścieżkę żądania npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Przesyła strumieniowo dokładne bajty przesłanego tarballa ClawPack dla klientów lustra npm.

Uwagi:

- Używa kubełka limitu szybkości pobierania.
- Nagłówki pobierania zawierają SHA-256 ClawHub oraz metadane npm integrity/shasum.
- Kontrole moderacji i dostępu do pakietów prywatnych nadal obowiązują.

### `GET /api/v1/resolve`

Używany przez CLI do mapowania lokalnego odcisku na znaną wersję.

Parametry zapytania:

- `slug` (wymagany)
- `hash` (wymagany): 64-znakowy szesnastkowy sha256 odcisku pakietu

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera ZIP hostowanej wersji umiejętności albo zwraca przekazanie do źródła GitHub dla
bieżącej umiejętności opartej na GitHub ze skanem `clean` lub `suspicious` i bez hostowanej
wersji.

Parametry zapytania:

- `slug` (wymagany)
- `version` (opcjonalny): ciąg semver
- `tag` (opcjonalny): nazwa tagu (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Wersje usunięte miękko zwracają `410`.
- Przekazania umiejętności opartych na GitHub nie pośredniczą w bajtach ani ich nie kopiują. Odpowiedź JSON
  zawiera `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  oraz `archiveUrl`; stan skanowania/bieżący jest bramką i nie jest uwzględniany jako metadane
  ładunku sukcesu.
- Statystyki pobrań są liczone jako unikatowe tożsamości na dzień UTC (`userId`, gdy token API jest prawidłowy, w przeciwnym razie IP).

## Punkty końcowe uwierzytelniania (token Bearer)

Wszystkie punkty końcowe wymagają:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Weryfikuje token i zwraca uchwyt użytkownika.

### `POST /api/v1/skills`

Publikuje nową wersję.

- Preferowane: `multipart/form-data` z JSON `payload` + blobami `files[]`.
- Akceptowane jest także ciało JSON z `files` (oparte na storageId).
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, API rozwiązuje tego
  wydawcę po stronie serwera i wymaga, aby aktor miał dostęp wydawcy.
- Opcjonalne pole ładunku: `migrateOwner`. Gdy ma wartość `true` z `ownerHandle`, istniejąca
  umiejętność może zostać przeniesiona do tego właściciela, jeśli aktor jest administratorem/właścicielem zarówno u
  bieżącego, jak i docelowego wydawcy. Bez tej jawnej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie `code-plugin` lub `bundle-plugin`.

- Wymaga uwierzytelniania tokenem Bearer.
- Wymaga `multipart/form-data`.
- Dozwolone pola formularza to `payload`, powtarzane bloby `files` albo jedno odwołanie do tarballa `clawpack`.
  `clawpack` może być blobem `.tgz` albo identyfikatorem storage id zwróconym przez
  przepływ upload-url. Publikacje etapowane przez storage-id muszą także zawierać
  `clawpackUploadTicket` zwrócony z tym URL-em przesyłania.
- Użyj albo `files`, albo `clawpack`, nigdy obu w tym samym żądaniu.
- Ciała JSON oraz metadane `payload.files` / `payload.artifact` dostarczone przez wywołującego
  są odrzucane.
- Bezpośrednie żądania publikacji multipart są ograniczone do 18 MB. Tarballe ClawPack mogą
  używać przepływu upload-url do limitu tarballa 120 MB.
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze elementy walidacji:

- `family` musi być `code-plugin` albo `bundle-plugin`.
- Pakiety Plugin wymagają `openclaw.plugin.json`. Przesyłane pliki `.tgz` ClawPack muszą
  zawierać go w `package/openclaw.plugin.json`.
- Pluginy kodu wymagają `package.json`, metadanych repozytorium źródłowego, metadanych commita źródłowego,
  metadanych schematu konfiguracji, `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` są opcjonalnymi metadanymi.
- Tylko wydawca organizacji `openclaw` oraz wydawcy osobiści obecnych członków organizacji `openclaw`
  mogą publikować w kanale `official`.
- Publikacje w czyimś imieniu nadal weryfikują uprawnienie do kanału official względem konta właściciela docelowego.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękko usuwa / przywraca umiejętność (właściciel, moderator lub administrator).

Opcjonalne ciało JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Gdy jest obecne, `reason` jest przechowywane jako notatka moderacyjna umiejętności i kopiowane do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni, po czym slug może zostać przejęty przez
innego wydawcę. Odpowiedź usunięcia zawiera `slugReservedUntil`, gdy to wygaśnięcie ma zastosowanie.
Ukrycia przez moderatora/administratora oraz usunięcia ze względów bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź usunięcia:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kody statusu:

- `200`: ok
- `401`: nieuwierzytelniono
- `403`: zabronione
- `404`: nie znaleziono umiejętności/użytkownika
- `500`: wewnętrzny błąd serwera

### `POST /api/v1/users/publisher`

Tylko administrator. Zapewnia istnienie wydawcy organizacji dla uchwytu. Jeśli uchwyt nadal wskazuje na
starszego współdzielonego użytkownika/wydawcę osobistego, punkt końcowy najpierw migruje go do wydawcy organizacji.
Dla nowo utworzonej organizacji podaj `memberHandle`; działający administrator nie jest dodawany jako członek.
`memberRole` domyślnie ma wartość `owner`.

- Ciało: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Uwierzytelnione samoobsługowe tworzenie wydawcy organizacji. Tworzy nowego wydawcę organizacji i dodaje
wywołującego jako właściciela. Ten punkt końcowy nie migruje istniejących uchwytów użytkownika/osobistych i nie
oznacza wydawcy jako zaufanego/oficjalnego.

- Ciało: `{ "handle": "opik", "displayName": "Opik" }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Zwraca `409`, gdy uchwyt jest już używany przez wydawcę, użytkownika lub wydawcę osobistego.

### `POST /api/v1/users/reserve`

Tylko administrator. Rezerwuje główne slugi i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, dzięki czemu ten sam
właściciel może później opublikować prawdziwe wydanie `code-plugin` lub `bundle-plugin` pod tą nazwą.

- Ciało: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Tylko administrator. Odzyskuje wydawcę osobistego dla zweryfikowanego zastępczego podmiotu GitHub OAuth
bez edytowania wierszy kont Convex Auth. Żądanie musi wskazywać oba niezmienne identyfikatory kont dostawcy GitHub;
zmienne uchwyty są używane tylko jako zabezpieczenie widoczne dla operatora.

Punkt końcowy domyślnie działa w trybie próbnym. Zastosowanie odzyskiwania wymaga `dryRun: false` oraz
`confirmIdentityVerified: true` po tym, jak personel niezależnie zweryfikuje ciągłość między oboma
podmiotami GitHub. Odzyskiwanie kończy się bezpieczną odmową, gdy bieżący osobisty
wydawca użytkownika docelowego ma Skills, pakiety lub źródła Skills w GitHub.
Odzyskiwanie migruje też starsze pola `ownerUserId` dla Skills odzyskiwanego wydawcy,
aliasów slugów Skills, pakietów, ostrzeżeń inspektora pakietów oraz pochodnych wierszy skrótu wyszukiwania, tak aby
ścieżki bezpośredniego właściciela były zgodne z nowym autorytetem wydawcy. Aktywna rezerwacja
chronionego uchwytu dla odzyskiwanego uchwytu jest także przypisywana użytkownikowi zastępczemu, aby późniejsza
synchronizacja profilu nie mogła przywrócić konkurencyjnego autorytetu poprzedniego użytkownika. Każda tabela główna jest ograniczona do
100 wierszy na transakcję zastosowania; większe odzyskiwania muszą najpierw użyć wznawialnej migracji właściciela.
Źródła Skills w GitHub są objęte zakresem wydawcy i zgłaszane jako sprawdzone, a nie przepisywane.

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

- Oba punkty końcowe wymagają uwierzytelnienia tokenem API i działają tylko dla właściciela Skills.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje slug źródłowy do wpisu docelowego.

### Punkty końcowe przenoszenia własności

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

Zablokuj użytkownika i trwale usuń należące do niego Skills (tylko moderator/administrator).

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

Odblokuj użytkownika i przywróć kwalifikujące się Skills (tylko administrator).

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
treści (tylko administrator). Domyślnie działa w trybie próbnym, chyba że `dryRun` ma wartość `false`.

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

Zmień rolę użytkownika (tylko administrator).

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

Wyświetl listę użytkowników lub wyszukaj użytkowników (tylko administrator).

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

`POST /api/cli/upload-url` zwraca `uploadUrl` oraz `uploadTicket`. Publikacje pakietów,
które przygotowują archiwum tar ClawPack, muszą wysłać wynikowy identyfikator pamięci masowej jako
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
