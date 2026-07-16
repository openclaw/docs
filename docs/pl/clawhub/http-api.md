---
read_when:
    - Dodawanie/zmienianie punktów końcowych
    - Debugowanie żądań CLI ↔ rejestr
summary: Dokumentacja referencyjna interfejsu HTTP API (publiczne punkty końcowe, punkty końcowe CLI i uwierzytelnianie).
x-i18n:
    generated_at: "2026-07-16T18:21:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# Interfejs API HTTP

Bazowy adres URL: `https://clawhub.ai` (domyślnie).

Wszystkie ścieżki v1 znajdują się pod `/api/v1/...`.
Starsze ścieżki `/api/...` i `/api/cli/...` pozostają dostępne ze względu na zgodność (zobacz `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Ponowne wykorzystywanie publicznego katalogu

Katalogi stron trzecich mogą używać publicznych punktów końcowych odczytu do wyświetlania lub wyszukiwania Skills ClawHub. Należy buforować wyniki, przestrzegać `429`/`Retry-After`, kierować użytkowników z powrotem do kanonicznej pozycji w ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) oraz unikać sugerowania, że ClawHub popiera witrynę strony trzeciej. Nie należy próbować odzwierciedlać ukrytych, prywatnych ani zablokowanych przez moderację treści poza publicznym interfejsem API.

Skróty slugów internetowych są rozpoznawane we wszystkich rodzinach rejestru, ale klienci API powinni używać
kanonicznych adresów URL zwracanych przez punkty końcowe odczytu zamiast samodzielnie odtwarzać kolejność
tras.

## Limity częstotliwości

Model egzekwowania:

- Żądania anonimowe: limit egzekwowany dla każdego adresu IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): limit egzekwowany dla puli użytkownika.
- Jeśli tokenu brakuje lub jest nieprawidłowy, stosowane jest egzekwowanie według adresu IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać samego `Unauthorized`, gdy
  serwer zna przyczynę. Brakujące tokeny, nieprawidłowe lub unieważnione tokeny oraz
  usunięte, zbanowane lub wyłączone konta powinny otrzymywać praktyczny komunikat, aby klienci
  CLI mogli poinformować użytkowników, co ich zablokowało.

- Odczyt: 3000/min na adres IP, 12000/min na klucz
- Zapis: 300/min na adres IP, 3000/min na klucz
- Pobieranie: 1200/min na adres IP, 6000/min na klucz (punkty końcowe pobierania)

Nagłówki:

- Zgodność ze starszymi wersjami: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Ustandaryzowane: `RateLimit-Limit`, `RateLimit-Reset`
- Przy `429`: `X-RateLimit-Remaining: 0` i `RateLimit-Remaining: 0`
- Przy `429`: `Retry-After`

Znaczenie nagłówków:

- `X-RateLimit-Reset`: bezwzględny czas epoki Unix w sekundach
- `RateLimit-Reset`: liczba sekund do zresetowania (opóźnienie)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały limit, jeśli jest dostępny.
  Pomyślne żądania obsługiwane przez fragmenty pomijają ten nagłówek zamiast zwracać przybliżoną wartość globalną.
- `Retry-After`: liczba sekund oczekiwania przed ponowieniem próby (opóźnienie) przy `429`

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

Przekroczono limit częstotliwości
```

Wskazówki dla klientów:

- Jeśli istnieje `Retry-After`, przed ponowieniem próby należy odczekać wskazaną liczbę sekund.
- Należy używać wycofywania z losowym odchyleniem, aby uniknąć zsynchronizowanych ponowień.
- Jeśli brakuje `Retry-After`, należy użyć awaryjnie `RateLimit-Reset` (lub obliczyć wartość na podstawie `X-RateLimit-Reset`).

Źródło adresu IP:

- Zaufane nagłówki adresu IP klienta, w tym `cf-connecting-ip`, są używane tylko wtedy, gdy
  wdrożenie jawnie włącza zaufane nagłówki przekazywane.
- ClawHub używa zaufanych nagłówków przekazywania do identyfikowania adresów IP klientów na brzegu sieci.
- Jeśli zaufany adres IP klienta nie jest dostępny, żądania anonimowe korzystają z pul awaryjnych
  ograniczonych wyłącznie do rodzaju limitu częstotliwości. Te pule awaryjne nie obejmują
  ścieżek, slugów, nazw pakietów, wersji, ciągów zapytania ani innych
  parametrów artefaktów podanych przez wywołującego.

## Odpowiedzi błędów

Publiczne odpowiedzi błędów v1 mają postać zwykłego tekstu z `content-type: text/plain; charset=utf-8`.
Obejmuje to błędy walidacji (`400`), brakujące zasoby publiczne (`404`), błędy uwierzytelniania i
uprawnień (`401`/`403`), limity częstotliwości (`429`) oraz zablokowane pobieranie. Klienci
powinni odczytywać treść odpowiedzi jako ciąg tekstowy czytelny dla człowieka. Nieznane parametry zapytania są
ignorowane ze względu na zgodność, ale rozpoznawane parametry zapytania z nieprawidłowymi wartościami zwracają
`400`.

## Publiczne punkty końcowe (bez uwierzytelniania)

### `GET /api/v1/search`

Parametry zapytania:

- `q` (wymagany): ciąg zapytania
- `limit` (opcjonalny): liczba całkowita
- `highlightedOnly` (opcjonalny): `true`, aby ograniczyć wyniki do wyróżnionych Skills
- `nonSuspiciousOnly` (opcjonalny): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalny): starszy alias parametru `nonSuspiciousOnly`

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

- Wyniki są zwracane według trafności (podobieństwo osadzeń + wzmocnienia dokładnych tokenów sluga/nazwy + niewielki współczynnik popularności).
- Trafność ma większe znaczenie niż popularność. Dokładne dopasowanie sluga lub tokenu nazwy wyświetlanej może znaleźć się wyżej niż luźniejsze dopasowanie o znacznie większym zaangażowaniu.
- Tekst ASCII jest dzielony na tokeny na granicach słów i znaków interpunkcyjnych. Na przykład `personal-map` zawiera samodzielny token `map`, a `amap-jsapi-skill` zawiera `amap`, `jsapi` i `skill`; dlatego wyszukanie `map` zapewnia `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Popularność jest skalowana logarytmicznie i ograniczana. Skills o dużym zaangażowaniu mogą znaleźć się niżej, gdy tekst zapytania pasuje do nich słabiej.
- Podejrzany lub ukryty stan moderacji może usunąć Skill z wyników publicznego wyszukiwania zależnie od filtrów wywołującego i bieżącego stanu moderacji.

Wskazówki dla wydawców dotyczące widoczności:

- Terminy, których użytkownicy będą dosłownie wyszukiwać, należy umieścić w nazwie wyświetlanej, podsumowaniu i tagach. Samodzielnego tokenu sluga należy używać tylko wtedy, gdy jest również stabilną tożsamością, która ma zostać zachowana.
- Nie należy zmieniać sluga tylko po to, aby poprawić wyniki dla jednego zapytania, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny adres URL, wyświetlany slug i przyszłe zestawienia wyszukiwania używają nowego sluga.
- Aliasy utworzone podczas zmiany nazwy zachowują rozpoznawanie starych adresów URL i instalacji rozpoznawanych przez rejestr, ale po zindeksowaniu zmiany nazwy ranking wyszukiwania opiera się na kanonicznych metadanych Skill. Istniejące statystyki pozostają powiązane ze Skill.
- Jeśli Skill jest nieoczekiwanie niewidoczny, przed zmianą metadanych związanych z rankingiem należy najpierw sprawdzić stan moderacji za pomocą `clawhub inspect @owner/slug` po zalogowaniu.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–200)
- `cursor` (opcjonalny): kursor paginacji dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalny): `updated` (domyślnie), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` odpowiadają `downloads`, `trending`
- `nonSuspiciousOnly` (opcjonalny): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalny): starszy alias parametru `nonSuspiciousOnly`

Nieprawidłowe wartości `sort` zwracają `400`.

Uwagi:

- `recommended` wykorzystuje sygnały zaangażowania i aktualności.
- `trending` szereguje według instalacji z ostatnich 7 dni (na podstawie telemetrii).
- `createdAt` jest stabilne dla indeksowania nowych Skills; `updated` zmienia się, gdy istniejące Skills są ponownie publikowane.
- Gdy `nonSuspiciousOnly=true`, sortowanie oparte na kursorze może zwrócić na stronie mniej niż `limit` elementów, ponieważ podejrzane Skills są filtrowane po pobraniu strony.
- Jeśli istnieje `nextCursor`, należy go użyć do kontynuowania paginacji. Krótka strona sama w sobie nie oznacza końca wyników.

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

- Stare slugi utworzone w procesach zmiany nazwy lub scalania przez właściciela są rozpoznawane jako kanoniczny Skill.
- `metadata.os`: ograniczenia systemu operacyjnego zadeklarowane w metadanych frontmatter Skill (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata.systems`: docelowe systemy Nix (np. `["aarch64-darwin", "x86_64-linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata` ma wartość `null`, jeśli Skill nie ma metadanych platformy.
- `moderation` jest uwzględniane tylko wtedy, gdy Skill jest oznaczony lub wyświetla go właściciel.

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

- Właściciele i moderatorzy mogą uzyskiwać dostęp do szczegółów moderacji ukrytych Skills.
- Wywołujący publiczni otrzymują `200` tylko dla widocznych Skills, które są już oznaczone.
- Dowody są redagowane dla wywołujących publicznych i zawierają surowe fragmenty tylko dla właścicieli oraz moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłasza Skill do sprawdzenia przez moderatora. Zgłoszenia dotyczą całego Skill, mogą być opcjonalnie powiązane
z wersją i trafiają do kolejki zgłoszeń Skills.

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

- `status` (opcjonalny): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
- `limit` (opcjonalny): liczba całkowita (1-200)
- `cursor` (opcjonalny): kursor paginacji

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
      "reason": "Podejrzany krok instalacji",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Zgłaszający"
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

Punkt końcowy dla moderatorów/administratorów służący do rozstrzygania lub ponownego otwierania zgłoszeń dotyczących Skills.

Żądanie:

```json
{ "status": "confirmed", "note": "Sprawdzono i ukryto wersję, której dotyczy problem.", "finalAction": "hide" }
```

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas
ponownego ustawiania `status` na `open`. Przekazanie `finalAction: "hide"` ze zweryfikowanym
zgłoszeniem pozwala ukryć Skill w ramach tego samego audytowalnego przepływu pracy.

### `GET /api/v1/skills/{slug}/versions`

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita
- `cursor` (opcjonalny): kursor paginacji

### `GET /api/v1/skills/{slug}/versions/{version}`

Zwraca metadane wersji i listę plików.

- `version.security` zawiera znormalizowany stan weryfikacji skanowania oraz szczegóły skanerów
  (VirusTotal + LLM), jeśli są dostępne.

### `GET /api/v1/skills/{slug}/scan`

Zwraca szczegóły weryfikacji skanowania bezpieczeństwa wersji Skill.

Parametry zapytania:

- `version` (opcjonalny): określony ciąg wersji.
- `tag` (opcjonalny): rozpoznanie oznaczonej wersji (na przykład `latest`).

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Obejmuje znormalizowany stan weryfikacji oraz szczegóły właściwe dla poszczególnych skanerów.
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wydał jednoznaczny werdykt (`clean`, `suspicious` lub `malicious`).
- `moderation` jest bieżącym obrazem stanu moderacji na poziomie Skill, ustalonym na podstawie najnowszej wersji.
- Podczas odpytywania wersji historycznej należy sprawdzić `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim `moderation` oraz `security` zostaną uznane za odnoszące się do tego samego kontekstu wersji.

### `POST /api/v1/skills/-/scan`

Uwierzytelniony punkt końcowy do przesyłania nowych zadań ClawScan.

Skanowanie lokalnie przesłanych plików nie jest już obsługiwane. Żądania używające
`multipart/form-data` lub `{ "source": { "kind": "upload" } }` zwracają `410`.

Skanowanie opublikowanych zasobów używa formatu JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Uwagi:

- Ładunki żądań skanowania i raporty dostępne do pobrania wygasają w magazynie żądań skanowania po upływie okresu przechowywania.
- Skanowanie opublikowanych zasobów wymaga dostępu właściciela/wydawcy do zarządzania albo uprawnień moderatora/administratora platformy.
- Skanowanie opublikowanych zasobów zapisuje wyniki z powrotem tylko wtedy, gdy `update: true`, a skanowanie zakończy się pomyślnie.
- Odpowiedź to `202` z `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Zadania skanowania są asynchroniczne. Ręczne żądania skanowania mają pierwszeństwo przed zwykłymi zadaniami publikowania/uzupełniania danych, ale ich ukończenie nadal zależy od dostępności procesów roboczych.

### `GET /api/v1/skills/-/scan/{scanId}`

Uwierzytelniony punkt końcowy do odpytywania stanu przesłanego skanowania.

- Zwraca stan oczekiwania, wykonywania, powodzenia lub niepowodzenia.
- Podczas oczekiwania zwraca `queue.queuedAhead` i `queue.position`, aby klienty mogły pokazać, ile priorytetowych skanowań ręcznych poprzedza dane żądanie. Bardzo duże kolejki są ograniczane i raportowane za pomocą `queuedAheadIsEstimate: true`.
- Jeśli jest dostępne, `report` zawiera sekcje `clawscan`, `skillspector`, `staticAnalysis` i `virustotal`.
- Zadania skanowania zakończone niepowodzeniem zwracają `status: "failed"` z `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Uwierzytelniony punkt końcowy archiwum raportów.

- Wymaga pomyślnie zakończonego skanowania; skanowania w stanie niekońcowym zwracają `409`.
- Zwraca archiwum ZIP zawierające `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` i `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Uwierzytelniony punkt końcowy archiwum zapisanych raportów dla przesłanych wersji.

- Wymaga dostępu właściciela/wydawcy do zarządzania danym Skill lub Pluginem albo uprawnień moderatora/administratora platformy.
- Zwraca zapisane wyniki skanowania dokładnie wskazanej przesłanej wersji, w tym wersji zablokowanych lub ukrytych.
- `kind` ma domyślnie wartość `skill`; w przypadku skanowania Pluginów/pakietów należy użyć `kind=plugin`.
- Zwraca archiwum ZIP o takiej samej strukturze jak pliki pobierane dla żądań skanowania.

### `POST /api/v1/skills/-/scan/batch`

Kanoniczna trasa administratora do ponownego skanowania wsadowego. Przyjmuje ładunek o takiej samej strukturze jak starsza trasa `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Kanoniczna trasa administratora do sprawdzania stanu wsadu. Przyjmuje `{ "jobIds": ["..."] }` i zwraca takie same zagregowane liczniki jak starsza trasa `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Zwraca kopertę weryfikacyjną karty Skill używaną przez `clawhub skill verify`.

Parametry zapytania:

- `version` (opcjonalny): określony ciąg wersji.
- `tag` (opcjonalny): rozpoznanie oznaczonej wersji (na przykład `latest`).

Uwagi:

- `ok` ma wartość `true` tylko wtedy, gdy wybrana wersja ma wygenerowaną kartę Skill, nie została zablokowana przez moderację z powodu złośliwego oprogramowania, a wynik weryfikacji ClawScan jest prawidłowy.
- Tożsamość Skill, tożsamość wydawcy i metadane wybranej wersji są polami najwyższego poziomu koperty (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), dzięki czemu automatyzacja powłoki może je odczytać bez rozpakowywania zagnieżdżonych obiektów opakowujących.
- `security` jest werdyktem ClawScan/bezpieczeństwa najwyższego poziomu. Automatyzacja powinna opierać się na `ok`, `decision`, `reasons` i `security.status`.
- `security.signals` zawiera pomocnicze dowody ze skanerów, takie jak `staticScan`, `virusTotal` i `skillSpector`.
- `security.signals.dependencyRegistry` zachowano w celu zgodności odpowiedzi v1, ale skaner sprawdzający istnienie rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- `provenance` ma wartość `server-resolved-github-import` tylko wtedy, gdy podczas publikowania lub importowania ClawHub rozpoznał i zapisał repozytorium/ref/commit/ścieżkę GitHub; w przeciwnym razie ma wartość `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Zwraca bieżące, skrócone werdykty bezpieczeństwa dla dokładnie wskazanych wersji Skills. Ten
punkt końcowy kolekcji jest przeznaczony dla klientów, które już wiedzą, które zainstalowane
wersje Skills ClawHub muszą wyświetlić, takich jak OpenClaw Control UI.

Żądanie:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Uwagi:

- `items` musi zawierać 1-100 unikatowych par `{ slug, version }`.
- Wyniki są zwracane osobno dla każdego elementu; brak jednego Skill lub wersji nie powoduje niepowodzenia całej odpowiedzi.
- Odpowiedź zawiera wyłącznie informacje o bezpieczeństwie. Nie obejmuje danych karty Skill, stanu wygenerowanej karty, list plików artefaktów ani szczegółowych ładunków skanerów.
- `security.signals` zawiera tylko pomocnicze dowody na poziomie stanu; pełne szczegóły skanerów są dostępne za pomocą `/scan` lub na stronie audytu bezpieczeństwa ClawHub.
- `security.signals.dependencyRegistry` zachowano w celu zgodności odpowiedzi v1, ale skaner sprawdzający istnienie rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- Brak karty Skill nie wpływa na `ok`, `decision` ani `reasons` tego punktu końcowego; gdy potrzebna jest zawartość karty, klienty powinny lokalnie odczytać zainstalowane `skill-card.md`.
- Należy użyć `/verify`, gdy potrzebna jest koperta weryfikacyjna karty pojedynczego Skill, `/card`, gdy potrzebny jest wygenerowany Markdown karty, oraz `/scan`, gdy potrzebne są szczegółowe dane skanerów.

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
      "error": { "code": "version_not_found", "message": "Nie znaleziono wersji" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Zwraca nieprzetworzoną zawartość tekstową.

Parametry zapytania:

- `path` (wymagany)
- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używana jest najnowsza wersja.
- Limit rozmiaru pliku: 200KB.

### `GET /api/v1/packages`

Ujednolicony punkt końcowy katalogu dla:

- Skills
- Pluginów kodu
- Pluginów pakietowych

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–100)
- `cursor` (opcjonalny): kursor paginacji
- `family` (opcjonalny): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalny): `official`, `community` lub `private`
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `updated` (domyślny), `recommended`, `trending`, `downloads`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii Pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest ograniczone do pakietów Pluginów (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` lub punktów końcowych pakietów z
  `family=code-plugin`/`family=bundle-plugin`). Kontrolowane kategorie i
  starsze aliasy filtrów v1 opisano w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` lub `sort` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami stałych rodzin.
- Wpisy Skills nadal są obsługiwane przez rejestr Skills i wciąż mogą być publikowane wyłącznie za pomocą `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy wyłącznie do wydań Pluginów kodu i Pluginów pakietowych.
- Nieuwierzytelnieni wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą w wynikach listowania/wyszukiwania widzieć prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie w katalogu obejmujące Skills i pakiety Pluginów.

Parametry zapytania:

- `q` (wymagany): ciąg zapytania
- `limit` (opcjonalny): liczba całkowita (1–100)
- `family` (opcjonalny): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalny): `official`, `community` lub `private`
- `isOfficial` (opcjonalny): `true` lub `false`
- `category` (opcjonalny): filtr kategorii pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest ograniczone do pakietów pluginów. Kontrolowane kategorie i starsze aliasy
  filtrów v1 opisano w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości parametrów `family`, `channel`, `isOfficial`, `featured` lub
  `highlightedOnly` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- Nieuwierzytelnieni wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/plugins`

Przeglądanie katalogu obejmujące wyłącznie pluginy w pakietach code-plugin i bundle-plugin.

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor paginacji
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `recommended` (domyślnie), `trending`, `downloads`, `updated`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii pluginów. Bieżące wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Starsze aliasy filtrów v1 są nadal akceptowane w punktach końcowych odczytu:

- `mcp-tooling`, `data` i `automation` są rozwiązywane jako `tools`.
- `observability` i `deployment` są rozwiązywane jako `gateway`.
- `dev-tools` jest rozwiązywany jako `runtime`.

`trending` to ranking instalacji/pobrań z siedmiu dni, który nie korzysta z łącznych wartości z całego okresu.
W ujednoliconym punkcie końcowym `/api/v1/packages` dotyczy on wyłącznie pluginów; katalog umiejętności
jest dostępny pod adresem `/api/v1/skills?sort=trending`.

Starsze aliasy nie są akceptowane jako przechowywane ani deklarowane przez autora wartości kategorii.

### `GET /api/v1/skills/export`

Zbiorczy eksport najnowszych publicznych umiejętności do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagany): dolna granica w milisekundach czasu Unix dla `updatedAt` umiejętności.
- `endDate` (wymagany): górna granica w milisekundach czasu Unix dla `updatedAt` umiejętności.
- `limit` (opcjonalny): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalny): kursor paginacji z poprzedniej odpowiedzi.

Odpowiedź:

- Treść: archiwum ZIP.
- Każda wyeksportowana umiejętność ma katalog główny w `{publisher}/{slug}/`.
- Hostowane umiejętności obejmują pliki najnowszej przechowywanej wersji i są wymienione w
  `_manifest.json` wraz z `sourceRef: "public-clawhub"`.
- Bieżące umiejętności oparte na GitHubie ze skanem `clean` lub `suspicious` obejmują
  `_source_handoff.json` wraz z `sourceRef: "public-github"`, repozytorium, commitem, ścieżką,
  skrótem treści i adresem URL archiwum. Nie obejmują plików źródłowych hostowanych w ClawHub.
- Każda umiejętność obejmuje `_export_skill_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym archiwum ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych umiejętności
  lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Zbiorczy eksport najnowszych publicznych wydań pluginów do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagany): dolna granica w milisekundach czasu Unix dla `updatedAt` pluginu.
- `endDate` (wymagany): górna granica w milisekundach czasu Unix dla `updatedAt` pluginu.
- `limit` (opcjonalny): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalny): kursor paginacji z poprzedniej odpowiedzi.
- `family` (opcjonalny): `code-plugin` lub `bundle-plugin`. Pominięcie oznacza obie
  rodziny pluginów.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany plugin ma katalog główny w `{family}/{packageName}/`.
- Każdy wyeksportowany plugin obejmuje przechowywane pliki najnowszego wydania.
- Metadane eksportu poszczególnych pluginów są przechowywane w
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym archiwum ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych pluginów
  lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Wyszukiwanie obejmujące wyłącznie pluginy w pakietach code-plugin i bundle-plugin.

Parametry zapytania:

- `q` (wymagany): ciąg zapytania
- `limit` (opcjonalny): liczba całkowita (1-100)
- `isOfficial` (opcjonalny): `true` lub `false`
- `category` (opcjonalny): filtr kategorii pluginów. Bieżące wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Uwagi:

- Starsze aliasy filtrów v1 opisane w sekcji `GET /api/v1/plugins` są również
  akceptowane.
- Filtrowanie według kategorii jest rzeczywistym filtrem API opartym na wierszach skrótów
  kategorii pluginów, a nie przekształceniem zapytania wyszukiwania.
- Wyniki są zwracane w kolejności trafności i obecnie nie są dzielone na strony.
- Elementy sterujące sortowaniem wyszukiwania pluginów w interfejsie przeglądarkowym zmieniają kolejność wczytanych wyników według trafności,
  zgodnie z bieżącym zachowaniem przeglądania `/skills`.

### `GET /api/v1/packages/{name}`

Zwraca szczegółowe metadane pakietu.

Uwagi:

- W ujednoliconym katalogu tą trasą mogą być również rozwiązywane umiejętności.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać dane wydawcy będącego ich właścicielem.

### `DELETE /api/v1/packages/{name}`

Usuwa logicznie pakiet i wszystkie wydania.

Uwagi:

- Wymaga tokenu API właściciela pakietu, właściciela/administratora organizacji wydawcy,
  moderatora platformy lub administratora platformy.

### `GET /api/v1/packages/{name}/versions`

Zwraca historię wersji.

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–100)
- `cursor` (opcjonalny): kursor paginacji

Uwagi:

- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać dane wydawcy będącego ich właścicielem.

### `GET /api/v1/packages/{name}/versions/{version}`

Zwraca jedną wersję pakietu wraz z metadanymi plików, zgodnością,
weryfikacją, metadanymi artefaktu i danymi skanowania.

Uwagi:

- `version.artifact.kind` ma wartość `legacy-zip` w przypadku archiwów pakietów starego typu lub
  `npm-pack` w przypadku wydań opartych na ClawPack.
- Wydania ClawPack obejmują zgodne z npm pola `npmIntegrity`, `npmShasum` i
  `npmTarballName`.
- `version.sha256hash` to przestarzałe metadane zgodności dla starych klientów. Stanowią
  skrót dokładnych bajtów ZIP zwracanych przez `/api/v1/packages/{name}/download`.
  Nowoczesne klienty powinny używać `version.artifact.sha256`, który identyfikuje
  kanoniczny artefakt wydania.
- `version.vtAnalysis`, `version.llmAnalysis` i `version.staticScan` są
  dołączane, gdy istnieją dane skanowania.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać dane wydawcy będącego ich właścicielem.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Zwraca dokładne podsumowanie bezpieczeństwa i zaufania do artefaktu wydania pakietu dla klientów
instalacyjnych. Jest to publiczny interfejs OpenClaw służący do określania, czy
rozwiązane wydanie można zainstalować.

Uwierzytelnianie:

- Publiczny punkt końcowy odczytu. Token właściciela, wydawcy, moderatora ani administratora nie jest
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
  rozwiązany pakiet rejestru.
- `release.releaseId`, `release.version` i `release.createdAt` identyfikują
  dokładne wydanie poddane ocenie.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` i `release.npmTarballName` są obecne, gdy są znane
  dla artefaktu wydania.
- `trust.scanStatus` to efektywny stan zaufania wyprowadzony z danych wejściowych skanera
  i ręcznej moderacji wydania.
- `trust.moderationState` może mieć wartość null. Ma wartość `null`, gdy nie istnieje ręczna
  moderacja wydania.
- `trust.blockedFromDownload` jest sygnałem blokady instalacji. OpenClaw i inne
  klienty instalacyjne powinny blokować instalację, gdy ta wartość wynosi `true`, zamiast
  ponownie wyprowadzać reguły blokowania z pól skanera lub moderacji.
- `trust.reasons` to przeznaczona dla użytkownika i audytu lista wyjaśnień. Kody przyczyn
  są stabilnymi, zwartymi ciągami, takimi jak `manual:quarantined`, `scan:malicious`
  i `package:malicious`.
- `trust.pending` oznacza, że co najmniej jedno źródło danych dotyczących zaufania nadal oczekuje na zakończenie.
- `trust.stale` oznacza, że podsumowanie zaufania obliczono na podstawie nieaktualnych danych wejściowych i
  przed podjęciem z wysoką pewnością decyzji o zezwoleniu należy je uznać za wymagające odświeżenia.

Uwagi:

- Ten punkt końcowy odnosi się do konkretnej wersji. Klienty powinny wywoływać go po rozwiązaniu
  wersji pakietu, którą zamierzają zainstalować, a nie tylko po odczytaniu najnowszych
  metadanych pakietu.
- Prywatne pakiety zwracają `404`, chyba że wywołujący może odczytać dane wydawcy będącego ich właścicielem.
- Ten punkt końcowy jest celowo węższy niż punkty końcowe moderacji
  dla właścicieli/moderatorów. Udostępnia decyzję instalacyjną i publiczne wyjaśnienie, ale nie
  tożsamości zgłaszających, treści zgłoszeń, prywatne dowody ani wewnętrzne
  harmonogramy przeglądów.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane mechanizmu rozwiązywania artefaktów dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` i starszy adres ZIP
  `downloadUrl`.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm,
  `tarballUrl` i starszy adres URL ZIP zapewniający zgodność.
- Jest to interfejs mechanizmu rozwiązywania OpenClaw; pozwala uniknąć zgadywania formatu archiwum na podstawie
  wspólnego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji za pośrednictwem jawnej ścieżki mechanizmu rozwiązywania.

Uwagi:

- Wersje ClawPack przesyłają strumieniowo dokładnie bajty `.tgz` przesłanego pakietu npm.
- Starsze wersje ZIP przekierowują do `/api/v1/packages/{name}/download?version=`.
- Korzysta z limitu szybkości pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczony stan gotowości do przyszłego użycia przez OpenClaw.

Kontrole gotowości obejmują:

- status oficjalnego kanału
- dostępność najnowszej wersji
- dostępność artefaktu pakietu npm ClawPack
- skrót artefaktu
- pochodzenie repozytorium źródłowego i commitu
- metadane zgodności z OpenClaw
- platformy docelowe
- stan skanowania

Odpowiedź:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Przykładowy Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "Artefakt ClawPack",
      "status": "fail",
      "message": "Najnowsza wersja jest dostępna wyłącznie jako starszy format ZIP."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Punkt końcowy moderatora służący do wyświetlania wierszy migracji oficjalnych pluginów OpenClaw.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `phase` (opcjonalny): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` lub
  `all` (domyślnie).
- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor stronicowania

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
      "blockers": ["brak ClawPack"],
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

Punkt końcowy administratora służący do tworzenia lub aktualizowania wiersza migracji oficjalnego pluginu.

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
  "blockers": ["brak ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "oczekiwanie na przesłanie przez wydawcę"
}
```

Uwagi:

- `bundledPluginId` jest normalizowany do małych liter i stanowi stabilny klucz operacji upsert.
- `packageName` jest normalizowany zgodnie z nazwami npm; pakiet może nie istnieć w przypadku planowanych
  migracji.
- Śledzi to wyłącznie gotowość migracji. Nie modyfikuje OpenClaw ani nie generuje
  pakietów ClawPack.

### `GET /api/v1/packages/moderation/queue`

Punkt końcowy moderatora/administratora obsługujący kolejki przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `status` (opcjonalny): `open` (domyślnie), `blocked`, `manual` lub `all`
- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor stronicowania

Znaczenie stanów:

- `open`: wydania podejrzane, złośliwe, oczekujące, poddane kwarantannie, unieważnione lub zgłoszone.
- `blocked`: wydania poddane kwarantannie, unieważnione lub złośliwe.
- `manual`: dowolne wydanie z ręcznym nadpisaniem decyzji moderacyjnej.
- `all`: dowolne wydanie z ręcznym nadpisaniem, stanem skanowania innym niż czysty lub zgłoszeniem pakietu.

Odpowiedź:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Przykładowy Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "ręczna weryfikacja",
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

Zgłasza pakiet do weryfikacji przez moderatora. Zgłoszenia dotyczą całego pakietu i mogą być
opcjonalnie powiązane z wersją. Trafiają do kolejki moderacji, ale same nie powodują automatycznego ukrycia
ani zablokowania pobierania; moderatorzy powinni używać moderacji wydań, aby
zatwierdzać artefakty, poddawać je kwarantannie lub je unieważniać.

Uwierzytelnianie:

- Wymaga tokenu API.

Żądanie:

```json
{ "reason": "Podejrzany natywny plik binarny", "version": "1.2.3" }
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

Punkt końcowy moderatora/administratora służący do przyjmowania zgłoszeń pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `status` (opcjonalny): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor stronicowania

Odpowiedź:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Przykładowy Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Podejrzany natywny plik binarny",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Zgłaszający"
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

Punkt końcowy właściciela/moderatora udostępniający informacje o widoczności pakietu w moderacji.

Uwierzytelnianie:

- Wymaga tokenu API właściciela pakietu, członka wydawcy, moderatora lub
  administratora.

Odpowiedź:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Przykładowy Plugin",
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
    "moderationReason": "ręczna weryfikacja",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Punkt końcowy moderatora/administratora służący do rozstrzygania lub ponownego otwierania zgłoszeń pakietów.

Żądanie:

```json
{
  "status": "confirmed",
  "note": "Zweryfikowano wydanie, którego dotyczy zgłoszenie, i poddano je kwarantannie.",
  "finalAction": "quarantine"
}
```

`note` jest wymagany dla `confirmed` i `dismissed`; można go pominąć podczas
ponownego ustawiania `status` na `open`. Należy przekazać `finalAction: "quarantine"` lub
`finalAction: "revoke"` wraz z potwierdzonym zgłoszeniem, aby zastosować moderację wydania w ramach
tego samego audytowalnego przepływu pracy.

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

Punkt końcowy moderatora/administratora służący do przeglądu wydania pakietu.

Żądanie:

```json
{ "state": "quarantined", "reason": "Podejrzany natywny ładunek." }
```

Obsługiwane stany:

- `approved`: ręcznie zweryfikowane i dozwolone.
- `quarantined`: zablokowane w oczekiwaniu na dalsze działania.
- `revoked`: zablokowane po wcześniejszym uznaniu wydania za zaufane.

Wydania poddane kwarantannie i unieważnione zwracają `403` z tras pobierania artefaktów.
Każda zmiana tworzy wpis w dzienniku audytu.

### `GET /api/v1/packages/{name}/file`

Zwraca nieprzetworzoną treść tekstową pliku pakietu.

Parametry zapytania:

- `path` (wymagany)
- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Korzysta z limitu szybkości odczytu, a nie pobierania.
- Pliki binarne zwracają `415`.
- Limit rozmiaru pliku: 200KB.
- Oczekujące skanowania VirusTotal nie blokują odczytu; złośliwe wydania mogą nadal być wstrzymywane w innych miejscach.
- Pakiety prywatne zwracają `404`, chyba że wywołujący ma uprawnienia do odczytu danych wydawcy będącego właścicielem.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze, deterministyczne archiwum ZIP wydania pakietu.

Parametry zapytania:

- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa pluginów/pakietów są plikami ZIP z katalogiem głównym `package/`, dzięki czemu starsze klienty OpenClaw
  nadal działają.
- Ta trasa obsługuje wyłącznie ZIP. Nie przesyła strumieniowo plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` i
  `X-ClawHub-Artifact-Sha256` do kontroli integralności przez resolver.
- Metadane dostępne wyłącznie w rejestrze nie są wstrzykiwane do pobieranego archiwum.
- Oczekujące skanowania VirusTotal nie blokują pobierania; złośliwe wydania zwracają `403`.
- Pakiety prywatne zwracają `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca zgodny z npm dokument packument dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wyświetlane są wyłącznie wersje z przesłanymi archiwami tar pakietów npm ClawPack.
- Starsze wersje dostępne wyłącznie jako ZIP są celowo pomijane.
- `dist.tarball`, `dist.integrity` i `dist.shasum` używają pól zgodnych z npm,
  dzięki czemu użytkownicy mogą wskazać npm kopię lustrzaną, jeśli zechcą.
- Dokumenty packument pakietów z zakresem obsługują zarówno `/api/npm/@scope/name`, jak i zakodowaną przez npm
  ścieżkę żądania `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Przesyła strumieniowo dokładnie bajty przesłanego archiwum tar ClawPack dla klientów kopii lustrzanej npm.

Uwagi:

- Korzysta z limitu szybkości pobierania.
- Nagłówki pobierania zawierają SHA-256 ClawHub oraz metadane integralności i sumy kontrolnej npm.
- Nadal obowiązują kontrole moderacji i dostępu do pakietów prywatnych.

### `GET /api/v1/resolve`

Używane przez CLI do mapowania lokalnego odcisku na znaną wersję.

Parametry zapytania:

- `slug` (wymagany)
- `hash` (wymagany): 64-znakowy szesnastkowy skrót sha256 odcisku pakietu

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera hostowane archiwum ZIP wersji umiejętności albo zwraca przekazanie do źródła GitHub dla
bieżącej umiejętności opartej na GitHub ze skanowaniem `clean` lub `suspicious` i bez hostowanej
wersji.

Parametry zapytania:

- `slug` (wymagane)
- `version` (opcjonalne): ciąg semver
- `tag` (opcjonalne): nazwa tagu (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Wersje usunięte miękko zwracają `410`.
- Przekazania Skills opartych na GitHubie nie pośredniczą w przesyłaniu bajtów ani ich nie dublują. Odpowiedź JSON
  zawiera `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  oraz `archiveUrl`; stan skanowania/bieżący stan pełni funkcję bramki i nie jest uwzględniany jako metadane
  ładunku odpowiedzi o powodzeniu.
- Statystyki pobrań są liczone jako unikatowe tożsamości na dzień UTC (`userId`, gdy token API jest prawidłowy, w przeciwnym razie adres IP).

## Punkty końcowe uwierzytelniania (token Bearer)

Wszystkie punkty końcowe wymagają:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Sprawdza poprawność tokenu i zwraca identyfikator użytkownika.

### `POST /api/v1/skills`

Publikuje nową wersję.

- Preferowane: `multipart/form-data` z JSON-em `payload` i blobami `files[]`.
- Akceptowane jest również ciało JSON z `files` (oparte na storageId).
- Opcjonalne pole ładunku: `ownerHandle`. Jeśli jest obecne, API rozpoznaje tego
  wydawcę po stronie serwera i wymaga, aby podmiot wykonujący operację miał dostęp wydawcy.
- Opcjonalne pole ładunku: `migrateOwner`. Gdy `true` z `ownerHandle`, istniejące
  Skills można przenieść do tego właściciela, jeśli podmiot wykonujący operację jest administratorem/właścicielem zarówno
  u bieżącego, jak i docelowego wydawcy. Bez tej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie pluginu kodowego lub pluginu pakietowego.

- Wymaga uwierzytelniania tokenem Bearer.
- Wymaga `multipart/form-data`.
- Dozwolone pola formularza to `payload`, powtarzające się bloby `files` lub jedno odwołanie
  do archiwum tar `clawpack`. `clawpack` może być blobem `.tgz` lub identyfikatorem magazynu zwróconym przez
  proces uzyskiwania adresu URL przesyłania. Publikacje etapowane przy użyciu identyfikatora magazynu muszą również zawierać
  `clawpackUploadTicket` zwrócony wraz z tym adresem URL przesyłania.
- Należy użyć albo `files`, albo `clawpack`, nigdy obu w tym samym żądaniu.
- Ciała JSON oraz metadane `payload.files` / `payload.artifact`
  podane przez wywołującego są odrzucane.
- Bezpośrednie wieloczęściowe żądania publikacji są ograniczone do 18MB. Archiwa tar ClawPack mogą
  korzystać z procesu uzyskiwania adresu URL przesyłania do limitu archiwum tar wynoszącego 120MB.
- Opcjonalne pole ładunku: `ownerHandle`. Jeśli jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze reguły walidacji:

- `family` musi mieć wartość `code-plugin` lub `bundle-plugin`.
- Pakiety pluginów wymagają `openclaw.plugin.json`. Przesyłane archiwa ClawPack `.tgz` muszą
  zawierać go w `package/openclaw.plugin.json`.
- Pluginy kodowe wymagają `package.json`, metadanych repozytorium źródłowego, metadanych commitu
  źródłowego, metadanych schematu konfiguracji, `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` są opcjonalnymi metadanymi.
- Tylko wydawca organizacji `openclaw` oraz osobiści wydawcy bieżących członków organizacji `openclaw`
  mogą publikować w kanale `official`.
- Publikacje w imieniu innego podmiotu nadal sprawdzają uprawnienia do oficjalnego kanału względem konta docelowego właściciela.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękko usuwa / przywraca Skills (właściciel, moderator lub administrator).

Opcjonalne ciało JSON:

```json
{ "reason": "Wstrzymano do moderacji w oczekiwaniu na weryfikację prawną." }
```

Jeśli `reason` jest obecne, zostaje zapisane jako notatka moderacyjna Skills i skopiowane do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni, po czym może on zostać przejęty przez
innego wydawcę. Gdy ten termin ważności ma zastosowanie, odpowiedź na usunięcie zawiera `slugReservedUntil`.
Ukrycia przez moderatora/administratora i usunięcia ze względów bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź na usunięcie:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kody stanu:

- `200`: powodzenie
- `401`: brak uwierzytelnienia
- `403`: brak uprawnień
- `404`: nie znaleziono Skills/użytkownika
- `500`: wewnętrzny błąd serwera

### `POST /api/v1/users/publisher`

Tylko dla administratorów. Zapewnia istnienie wydawcy organizacji dla danego identyfikatora. Jeśli identyfikator nadal wskazuje
starszego współdzielonego użytkownika/osobistego wydawcę, punkt końcowy najpierw migruje go do wydawcy organizacji.
W przypadku nowo utworzonej organizacji należy podać `memberHandle`; administrator wykonujący operację nie jest dodawany jako członek.
Domyślna wartość `memberRole` to `owner`.

- Ciało: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Uwierzytelnione samodzielne tworzenie wydawcy organizacji. Tworzy nowego wydawcę organizacji i dodaje
wywołującego jako właściciela. Ten punkt końcowy nie migruje istniejących identyfikatorów użytkowników/osobistych
ani nie oznacza wydawcy jako zaufanego/oficjalnego.

- Ciało: `{ "handle": "opik", "displayName": "Opik" }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Zwraca `409`, gdy identyfikator jest już używany przez wydawcę, użytkownika lub osobistego wydawcę.

### `POST /api/v1/users/reserve`

Tylko dla administratorów. Rezerwuje główne slugi i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, dzięki czemu ten sam
właściciel może później opublikować pod tą nazwą właściwe wydanie pluginu kodowego lub pluginu pakietowego.

- Ciało: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Tylko dla administratorów. Odzyskuje osobistego wydawcę dla zweryfikowanego zastępczego podmiotu GitHub OAuth
bez edytowania wierszy kont Convex Auth. Żądanie musi wskazywać oba niezmienne identyfikatory kont
dostawcy GitHub; zmienne identyfikatory służą jedynie jako zabezpieczenie dla operatora.

Punkt końcowy domyślnie wykonuje przebieg próbny. Zastosowanie odzyskiwania wymaga `dryRun: false` i
`confirmIdentityVerified: true` po niezależnym zweryfikowaniu przez personel ciągłości między oboma
podmiotami GitHub. Odzyskiwanie jest bezpiecznie przerywane, gdy bieżący osobisty wydawca użytkownika docelowego
ma Skills, pakiety lub źródła Skills z GitHuba.
Odzyskiwanie migruje również starsze pola `ownerUserId` dla Skills odzyskanego wydawcy,
aliasów slugów Skills, pakietów, ostrzeżeń inspektora pakietów i pochodnych wierszy skrótów wyszukiwania, aby
ścieżki bezpośredniego właściciela były zgodne z nowymi uprawnieniami wydawcy. Aktywna rezerwacja
chronionego identyfikatora dla odzyskanego identyfikatora jest również przypisywana zastępczemu użytkownikowi, aby późniejsza
synchronizacja profilu nie mogła przywrócić konkurencyjnych uprawnień poprzedniego użytkownika. Każda tabela główna jest ograniczona do
100 wierszy na transakcję zastosowania; większe operacje odzyskiwania muszą najpierw użyć wznawialnej migracji właściciela.
Źródła Skills z GitHuba mają zakres wydawcy i są zgłaszane jako sprawdzone, a nie przepisywane.

- Ciało: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Odpowiedź: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Punkty końcowe zarządzania slugami właściciela

- `POST /api/v1/skills/{slug}/rename`
  - Ciało: `{ "newSlug": "new-canonical-slug" }`
  - Odpowiedź: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Ciało: `{ "targetSlug": "canonical-target-slug" }`
  - Odpowiedź: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Uwagi:

- Oba punkty końcowe wymagają uwierzytelniania tokenem API i działają tylko dla właściciela Skills.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje slug źródłowy do wpisu docelowego.

### Punkty końcowe przenoszenia własności

- `POST /api/v1/skills/{slug}/transfer`
  - Ciało: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Odpowiedź: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Odpowiedź (akceptacja/odrzucenie/anulowanie): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Struktura odpowiedzi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blokuje użytkownika i trwale usuwa należące do niego Skills (tylko moderator/administrator).

Ciało:

```json
{ "handle": "user_handle", "reason": "opcjonalny powód blokady" }
```

lub

```json
{ "userId": "users_...", "reason": "opcjonalny powód blokady" }
```

Odpowiedź:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Odblokowuje użytkownika i przywraca kwalifikujące się Skills (tylko administrator).

Ciało:

```json
{ "handle": "user_handle", "reason": "opcjonalny powód odblokowania" }
```

lub

```json
{ "userId": "users_...", "reason": "opcjonalny powód odblokowania" }
```

Odpowiedź:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Zmienia zapisany powód istniejącej blokady bez odblokowywania użytkownika ani przywracania
treści (tylko administrator). Domyślnie wykonuje przebieg próbny, chyba że `dryRun` ma wartość `false`.

Ciało:

```json
{ "handle": "user_handle", "reason": "spam polegający na masowym publikowaniu", "dryRun": true }
```

lub

```json
{ "userId": "users_...", "reason": "spam polegający na masowym publikowaniu", "dryRun": false }
```

Odpowiedź:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "automatyczna blokada za złośliwe oprogramowanie",
  "nextReason": "spam polegający na masowym publikowaniu",
  "changed": true
}
```

### `POST /api/v1/users/role`

Zmienia rolę użytkownika (tylko administrator).

Ciało:

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

Wyświetla listę użytkowników lub ich wyszukuje (tylko administrator).

Parametry zapytania:

- `q` (opcjonalne): zapytanie wyszukiwania
- `query` (opcjonalne): alias dla `q`
- `limit` (opcjonalne): maksymalna liczba wyników (domyślnie 20, maksymalnie 200)

Odpowiedź:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Użytkownik",
      "name": "Użytkownik",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Dodaje/usuwa gwiazdkę (wyróżnienie). Oba punkty końcowe są idempotentne.

Odpowiedzi:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Starsze punkty końcowe CLI (przestarzałe)

Nadal obsługiwane w starszych wersjach CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Plan usunięcia znajduje się w `DEPRECATIONS.md`.

`POST /api/cli/upload-url` zwraca `uploadUrl` i `uploadTicket`. Publikacje
pakietów, które etapują archiwum tar ClawPack, muszą wysłać wynikowy identyfikator magazynu jako
`clawpack`, a zwrócony bilet jako `clawpackUploadTicket`.

## Wykrywanie rejestru (`/.well-known/clawhub.json`)

CLI może wykrywać ustawienia rejestru/uwierzytelniania z witryny:

- `/.well-known/clawhub.json` (JSON, preferowane)
- `/.well-known/clawdhub.json` (starsze)

Schemat:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

W przypadku samodzielnego hostowania należy udostępnić ten plik (lub jawnie ustawić `CLAWHUB_REGISTRY`; starsze `CLAWDHUB_REGISTRY`).
