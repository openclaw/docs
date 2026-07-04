---
read_when:
    - Dodawanie/zmienianie punktów końcowych
    - Debugowanie żądań CLI ↔ rejestr
summary: Dokumentacja referencyjna HTTP API (publiczne + punkty końcowe CLI + uwierzytelnianie).
x-i18n:
    generated_at: "2026-07-04T04:08:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Bazowy URL: `https://clawhub.ai` (domyślnie).

Wszystkie ścieżki v1 znajdują się pod `/api/v1/...`.
Starsze `/api/...` i `/api/cli/...` pozostają dla zgodności (zobacz `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Ponowne użycie katalogu publicznego

Katalogi firm trzecich mogą używać publicznych punktów końcowych odczytu do wyświetlania listy lub wyszukiwania Skills w ClawHub. Buforuj wyniki, respektuj `429`/`Retry-After`, odsyłaj użytkowników do kanonicznej listy ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) i unikaj sugerowania, że ClawHub popiera stronę firmy trzeciej. Nie próbuj kopiować ukrytych, prywatnych ani zablokowanych przez moderację treści poza publiczną powierzchnią API.

Skróty slugów webowych są rozwiązywane między rodzinami rejestru, ale klienci API powinni używać
kanonicznych URL-i zwracanych przez punkty końcowe odczytu zamiast rekonstruować kolejność
pierwszeństwa tras.

## Limity szybkości

Model egzekwowania:

- Żądania anonimowe: egzekwowane według IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): egzekwowane według koszyka użytkownika.
- Jeśli tokenu brakuje lub jest nieprawidłowy, zachowanie wraca do egzekwowania według IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać samego `Unauthorized`, gdy
  serwer zna przyczynę. Brakujące tokeny, nieprawidłowe/odwołane tokeny oraz
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

- `X-RateLimit-Reset`: bezwzględny czas epoki Unix w sekundach
- `RateLimit-Reset`: sekundy do zresetowania (opóźnienie)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały budżet, gdy jest obecny.
  Pomyślne żądania shardowane pomijają ten nagłówek zamiast zwracać przybliżoną wartość globalną.
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

Wskazówki dla klienta:

- Jeśli istnieje `Retry-After`, poczekaj tyle sekund przed ponowną próbą.
- Używaj backoffu z jitterem, aby uniknąć zsynchronizowanych ponownych prób.
- Jeśli brakuje `Retry-After`, wróć do `RateLimit-Reset` (albo oblicz z `X-RateLimit-Reset`).

Źródło IP:

- Używa zaufanych nagłówków IP klienta, w tym `cf-connecting-ip`, tylko wtedy, gdy
  wdrożenie jawnie włącza zaufane przekazywane nagłówki.
- ClawHub używa zaufanych nagłówków przekazywania do identyfikowania IP klientów na brzegu sieci.
- Jeśli zaufane IP klienta nie jest dostępne, żądania anonimowe używają zapasowych koszyków
  ograniczonych tylko zakresem rodzaju limitu szybkości. Te zapasowe koszyki nie obejmują
  ścieżek, slugów, nazw pakietów, wersji, ciągów zapytania ani innych
  parametrów artefaktów dostarczonych przez wywołującego.

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

- Wyniki są zwracane w kolejności trafności (podobieństwo osadzeń + wzmocnienia dokładnego tokenu sluga/nazwy + mały priorytet popularności).
- Trafność jest silniejsza niż popularność. Dokładne dopasowanie sluga lub tokenu nazwy wyświetlanej może wyprzedzić luźniejsze dopasowanie o znacznie większym zaangażowaniu.
- Tekst ASCII jest tokenizowany na granicach słów i interpunkcji. Na przykład `personal-map` zawiera samodzielny token `map`, podczas gdy `amap-jsapi-skill` zawiera `amap`, `jsapi` i `skill`; wyszukanie `map` daje więc `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Popularność jest skalowana logarytmicznie i ograniczana. Skills o wysokim zaangażowaniu mogą plasować się niżej, gdy tekst zapytania jest słabszym dopasowaniem.
- Podejrzany lub ukryty stan moderacji może usunąć Skill z publicznego wyszukiwania zależnie od filtrów wywołującego i bieżącego statusu moderacji.

Wskazówki dotyczące wykrywalności dla wydawców:

- Umieść terminy, których użytkownicy będą dosłownie szukać, w nazwie wyświetlanej, podsumowaniu i tagach. Używaj samodzielnego tokenu sluga tylko wtedy, gdy jest też stabilną tożsamością, którą chcesz zachować.
- Nie zmieniaj nazwy sluga tylko po to, aby gonić za jednym zapytaniem, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny URL, wyświetlany slug i przyszłe streszczenia wyszukiwania używają nowego sluga.
- Aliasy zmiany nazwy zachowują rozwiązywanie dla starych URL-i i instalacji rozwiązywanych przez rejestr, ale ranking wyszukiwania opiera się na kanonicznych metadanych Skill po zaindeksowaniu zmiany nazwy. Istniejące statystyki pozostają przy Skill.
- Jeśli Skill jest nieoczekiwanie niewidoczny, najpierw sprawdź stan moderacji za pomocą `clawhub inspect @owner/slug` po zalogowaniu, zanim zmienisz metadane związane z rankingiem.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalne): liczba całkowita (1–200)
- `cursor` (opcjonalne): kursor paginacji dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalne): `updated` (domyślnie), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` mapują się na `downloads`, `trending`
- `nonSuspiciousOnly` (opcjonalne): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalne): starszy alias dla `nonSuspiciousOnly`

Nieprawidłowe wartości `sort` zwracają `400`.

Uwagi:

- `recommended` używa sygnałów zaangażowania i świeżości.
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

- Stare slugi utworzone przez przepływy zmiany nazwy/scalania właściciela rozwiązują się do kanonicznego Skill.
- `metadata.os`: ograniczenia OS zadeklarowane we frontmatterze Skill (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
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
- Dowody są redagowane dla publicznych wywołujących i obejmują surowe fragmenty tylko dla właścicieli/moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłoś Skill do przeglądu przez moderatora. Zgłoszenia są na poziomie Skill, opcjonalnie powiązane
z wersją, i trafiają do kolejki zgłoszeń Skills.

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

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas
ustawiania `status` z powrotem na `open`. Przekaż `finalAction: "hide"` ze zgłoszeniem po triage’u,
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
- Zawiera znormalizowany status weryfikacji oraz szczegóły specyficzne dla skanera.
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wygenerował rozstrzygający werdykt (`clean`, `suspicious` lub `malicious`).
- `moderation` to bieżący zrzut moderacji na poziomie umiejętności, wyprowadzony z najnowszej wersji.
- Podczas odpytywania wersji historycznej sprawdź `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim potraktujesz `moderation` i `security` jako ten sam kontekst wersji.

### `POST /api/v1/skills/-/scan`

Uwierzytelniony endpoint przesyłania dla nowych zadań ClawScan.

Lokalne skanowania przesyłanych plików nie są już obsługiwane. Żądania używające
`multipart/form-data` lub `{ "source": { "kind": "upload" } }` zwracają `410`.

Skanowania opublikowanych wersji używają JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Uwagi:

- Ładunki żądań skanowania i raporty do pobrania wygasają z magazynu żądań skanowania po okresie retencji.
- Skanowania opublikowanych wersji wymagają dostępu zarządczego właściciela/wydawcy albo uprawnień moderatora/administratora platformy.
- Skanowania opublikowanych wersji zapisują wyniki z powrotem tylko wtedy, gdy `update: true`, a skanowanie zakończy się powodzeniem.
- Odpowiedź to `202` z `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Zadania skanowania są asynchroniczne. Ręczne żądania skanowania mają priorytet przed zwykłą pracą publikacji/uzupełniania, ale ukończenie nadal zależy od dostępności workerów.

### `GET /api/v1/skills/-/scan/{scanId}`

Uwierzytelniony endpoint odpytywania przesłanego skanowania.

- Zwraca status queued/running/succeeded/failed.
- Zwraca `queue.queuedAhead` i `queue.position`, gdy żądanie jest w kolejce, aby klienci mogli pokazać, ile priorytetowych ręcznych skanowań znajduje się przed żądaniem. Bardzo duże kolejki są ograniczane i raportowane z `queuedAheadIsEstimate: true`.
- Gdy jest dostępny, `report` zawiera sekcje `clawscan`, `skillspector`, `staticAnalysis` i `virustotal`.
- Nieudane zadania skanowania zwracają `status: "failed"` z `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Uwierzytelniony endpoint archiwum raportu.

- Wymaga skanowania zakończonego powodzeniem; skanowania niekońcowe zwracają `409`.
- Zwraca ZIP z `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` i `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Uwierzytelniony endpoint przechowywanego archiwum raportu dla przesłanych wersji.

- Wymaga dostępu zarządczego właściciela/wydawcy do umiejętności lub pluginu albo uprawnień moderatora/administratora platformy.
- Zwraca przechowywane wyniki skanowania dla dokładnej przesłanej wersji, w tym wersji zablokowanych lub ukrytych.
- `kind` domyślnie ma wartość `skill`; użyj `kind=plugin` dla skanowań pluginów/pakietów.
- Zwraca taki sam kształt ZIP jak pobrania żądań skanowania.

### `POST /api/v1/skills/-/scan/batch`

Kanoniczna trasa ponownego skanowania wsadowego tylko dla administratorów. Akceptuje taki sam kształt ładunku jak starsze `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Kanoniczna trasa statusu wsadu tylko dla administratorów. Akceptuje `{ "jobIds": ["..."] }` i zwraca te same zagregowane liczniki co starsze `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Zwraca kopertę weryfikacji Skill Card używaną przez `clawhub skill verify`.

Parametry zapytania:

- `version` (opcjonalne): określony ciąg wersji.
- `tag` (opcjonalne): rozwiązuje otagowaną wersję (na przykład `latest`).

Uwagi:

- `ok` ma wartość `true` tylko wtedy, gdy wybrana wersja ma wygenerowaną Skill Card, nie jest zablokowana jako malware przez moderację, a weryfikacja ClawScan jest czysta.
- Tożsamość umiejętności, tożsamość wydawcy i metadane wybranej wersji są polami koperty najwyższego poziomu (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), aby automatyzacja powłoki mogła je odczytywać bez rozpakowywania zagnieżdżonych wrapperów.
- `security` to werdykt ClawScan/bezpieczeństwa najwyższego poziomu. Automatyzacja powinna opierać się na `ok`, `decision`, `reasons` i `security.status`.
- `security.signals` zawiera pomocnicze dowody skanerów, takie jak `staticScan`, `virusTotal` i `skillSpector`.
- `security.signals.dependencyRegistry` jest zachowane dla zgodności odpowiedzi v1, ale skaner istnienia rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- `provenance` ma wartość `server-resolved-github-import` tylko wtedy, gdy ClawHub rozwiązał i zapisał repo/ref/commit/path GitHub podczas publikacji lub importu; w przeciwnym razie ma wartość `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Zwraca bieżące zwarte werdykty bezpieczeństwa dla dokładnych wersji umiejętności. Ten
endpoint kolekcji jest przeznaczony dla klientów, którzy już wiedzą, które zainstalowane
wersje umiejętności ClawHub muszą wyświetlić, takich jak OpenClaw Control UI.

Żądanie:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Uwagi:

- `items` musi zawierać 1-100 unikalnych par `{ slug, version }`.
- Wyniki są zwracane dla każdego elementu; brak jednej umiejętności lub wersji nie powoduje niepowodzenia całej odpowiedzi.
- Odpowiedź dotyczy wyłącznie bezpieczeństwa. Nie obejmuje danych Skill Card, statusu wygenerowanej karty, list plików artefaktów ani szczegółowych ładunków skanerów.
- `security.signals` zawiera tylko pomocnicze dowody na poziomie statusu; użyj `/scan` lub strony audytu bezpieczeństwa ClawHub, aby uzyskać pełne szczegóły skanerów.
- `security.signals.dependencyRegistry` jest zachowane dla zgodności odpowiedzi v1, ale skaner istnienia rejestru zależności został wycofany i ten klucz zawsze ma wartość `null`.
- Brak Skill Card nie wpływa na `ok`, `decision` ani `reasons` tego endpointu; klienci powinni lokalnie odczytywać zainstalowany `skill-card.md`, gdy potrzebują treści karty.
- Użyj `/verify`, gdy potrzebujesz koperty weryfikacji Skill Card dla pojedynczej umiejętności, `/card`, gdy potrzebujesz wygenerowanego markdown karty, oraz `/scan`, gdy potrzebujesz szczegółowych danych skanerów.

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

Ujednolicony punkt końcowy katalogu dla:

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
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` albo punktów końcowych pakietów z
  `family=code-plugin`/`family=bundle-plugin`). Kontrolowane kategorie i
  starsze aliasy filtrów v1 są udokumentowane w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` lub `sort` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami o stałej rodzinie.
- Wpisy Skills nadal są oparte na rejestrze Skills i wciąż mogą być publikowane tylko przez `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy tylko do wydań `code-plugin` i `bundle-plugin`.
- Anonimowi wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą widzieć pakiety prywatne wydawców, do których należą, w wynikach listy/wyszukiwania.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie w katalogu obejmujące Skills i pakiety pluginów.

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

- Nieprawidłowe wartości `family`, `channel`, `isOfficial`, `featured` lub
  `highlightedOnly` zwracają `400`. Nieznane parametry zapytania są ignorowane.
- Anonimowi wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca tylko pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/plugins`

Przeglądanie katalogu tylko z pluginami, obejmujące pakiety `code-plugin` i `bundle-plugin`.

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor paginacji
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `recommended` (domyślnie), `trending`, `downloads`, `updated`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii pluginów. Bieżące wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Starsze aliasy filtrów v1 nadal są akceptowane w punktach końcowych odczytu:

- `mcp-tooling`, `data` i `automation` są rozwiązywane do `tools`.
- `observability` i `deployment` są rozwiązywane do `gateway`.
- `dev-tools` jest rozwiązywany do `runtime`.

`trending` to siedmiodniowa lista liderów instalacji/pobrań i nie używa sum z całego okresu.
W ujednoliconym punkcie końcowym `/api/v1/packages` dotyczy tylko pluginów; dla katalogu Skills użyj
`/api/v1/skills?sort=trending`.

Starsze aliasy nie są akceptowane jako przechowywane ani deklarowane przez autora wartości kategorii.

### `GET /api/v1/skills/export`

Masowy eksport najnowszych publicznych Skills do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagany): dolna granica w milisekundach uniksowych dla `updatedAt` Skills.
- `endDate` (wymagany): górna granica w milisekundach uniksowych dla `updatedAt` Skills.
- `limit` (opcjonalny): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalny): kursor paginacji z poprzedniej odpowiedzi.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Skill ma katalog główny w `{publisher}/{slug}/`.
- Hostowane Skills zawierają najnowsze zapisane pliki wersji i są wymienione w
  `_manifest.json` z `sourceRef: "public-clawhub"`.
- Bieżące Skills oparte na GitHub z wynikiem skanowania `clean` lub `suspicious` zawierają
  `_source_handoff.json` z `sourceRef: "public-github"`, repozytorium, commitem, ścieżką,
  hashem treści i adresem URL archiwum. Nie zawierają plików źródłowych hostowanych w ClawHub.
- Każdy Skill zawiera `_export_skill_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych Skills lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Zbiorczy eksport najnowszych publicznych wydań Plugin do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagane): dolna granica `updatedAt` Plugin w milisekundach Unix.
- `endDate` (wymagane): górna granica `updatedAt` Plugin w milisekundach Unix.
- `limit` (opcjonalne): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalne): kursor paginacji z poprzedniej odpowiedzi.
- `family` (opcjonalne): `code-plugin` lub `bundle-plugin`. Pominięcie oznacza obie
  rodziny Plugin.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Plugin ma katalog główny w `{family}/{packageName}/`.
- Każdy wyeksportowany Plugin zawiera zapisane pliki z najnowszego wydania.
- Metadane eksportu dla każdego Plugin są przechowywane w
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` jest zawsze dołączany w katalogu głównym ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych Plugin lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Wyszukiwanie tylko Plugin w pakietach code-plugin i bundle-plugin.

Parametry zapytania:

- `q` (wymagane): ciąg zapytania
- `limit` (opcjonalne): liczba całkowita (1-100)
- `isOfficial` (opcjonalne): `true` lub `false`
- `category` (opcjonalne): filtr kategorii Plugin. Bieżące wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Uwagi:

- Obsługiwane są także starsze aliasy filtrów v1 udokumentowane pod `GET /api/v1/plugins`.
- Filtrowanie kategorii to rzeczywisty filtr API oparty na wierszach skrótu kategorii Plugin,
  a nie przepisanie zapytania wyszukiwania.
- Wyniki są zwracane według trafności i obecnie nie są paginowane.
- Kontrolki sortowania interfejsu przeglądarki dla wyszukiwania Plugin zmieniają kolejność wczytanych wyników trafności,
  zgodnie z bieżącym zachowaniem przeglądania `/skills`.

### `GET /api/v1/packages/{name}`

Zwraca szczegółowe metadane pakietu.

Uwagi:

- Skills mogą także być rozwiązywane przez tę trasę w ujednoliconym katalogu.
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

- `version.artifact.kind` ma wartość `legacy-zip` dla dawnych archiwów pakietów lub
  `npm-pack` dla wydań opartych na ClawPack.
- Wydania ClawPack zawierają pola zgodne z npm: `npmIntegrity`, `npmShasum` i
  `npmTarballName`.
- `version.sha256hash` to przestarzałe metadane zgodności dla starych klientów. Haszują
  dokładne bajty ZIP zwracane przez `/api/v1/packages/{name}/download`.
  Nowoczesne klienty powinny używać `version.artifact.sha256`, które identyfikuje
  kanoniczny artefakt wydania.
- `version.vtAnalysis`, `version.llmAnalysis` i `version.staticScan` są
  dołączane, gdy istnieją dane skanowania.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Zwraca dokładne podsumowanie bezpieczeństwa i zaufania wydania pakietu dla klientów instalacyjnych.
To publiczna powierzchnia konsumpcji OpenClaw do decydowania, czy
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
  dokładne wydanie, które zostało ocenione.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` i `release.npmTarballName` są obecne, gdy są znane dla
  artefaktu wydania.
- `trust.scanStatus` to efektywny status zaufania wyprowadzony z danych wejściowych skanera
  i ręcznej moderacji wydania.
- `trust.moderationState` może mieć wartość null. Ma wartość `null`, gdy nie istnieje ręczna
  moderacja wydania.
- `trust.blockedFromDownload` to sygnał blokady instalacji. OpenClaw i inne
  klienty instalacyjne powinny blokować instalację, gdy ta wartość to `true`, zamiast
  ponownie wyprowadzać reguły blokowania z pól skanera lub moderacji.
- `trust.reasons` to lista wyjaśnień dla użytkownika i audytu. Kody powodów
  są stabilnymi, zwięzłymi ciągami, takimi jak `manual:quarantined`, `scan:malicious`,
  i `package:malicious`.
- `trust.pending` oznacza, że co najmniej jedno wejście zaufania nadal oczekuje na ukończenie.
- `trust.stale` oznacza, że podsumowanie zaufania zostało obliczone z nieaktualnych danych wejściowych i
  powinno być traktowane jako wymagające odświeżenia przed decyzją o zezwoleniu o wysokiej pewności.

Uwagi:

- Ten punkt końcowy jest dokładny względem wersji. Klienty powinny wywołać go po rozwiązaniu
  wersji pakietu, którą zamierzają zainstalować, a nie tylko po odczytaniu najnowszych
  metadanych pakietu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właściciela wydawcy.
- Ten punkt końcowy jest celowo węższy niż punkty końcowe moderacji właściciela/moderatora.
  Ujawnia decyzję instalacyjną i publiczne wyjaśnienie, a nie
  tożsamości zgłaszających, treści zgłoszeń, prywatne dowody ani wewnętrzne osie czasu przeglądu.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane resolvera artefaktu dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` i starszy ZIP
  `downloadUrl`.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm,
  `tarballUrl` oraz starszy adres URL zgodności ZIP.
- To jest powierzchnia resolvera OpenClaw; pozwala uniknąć zgadywania formatu archiwum na podstawie
  wspólnego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji przez jawną ścieżkę resolvera.

Uwagi:

- Wersje ClawPack strumieniują dokładne przesłane bajty `.tgz` npm-pack.
- Starsze wersje ZIP przekierowują do `/api/v1/packages/{name}/download?version=`.
- Używa koszyka limitu pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczoną gotowość do przyszłej konsumpcji przez OpenClaw.

Kontrole gotowości obejmują:

- status oficjalnego kanału
- dostępność najnowszej wersji
- dostępność artefaktu ClawPack npm-pack
- skrót artefaktu
- pochodzenie repozytorium źródłowego i commitu
- metadane zgodności OpenClaw
- cele hostów
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

Punkt końcowy administratora do tworzenia lub aktualizowania wiersza migracji oficjalnego Plugin.

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
- `packageName` jest normalizowany jako nazwa npm; pakiet może być nieobecny dla planowanych
  migracji.
- To śledzi wyłącznie gotowość migracji. Nie modyfikuje OpenClaw ani nie generuje
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Punkt końcowy moderatora/administratora dla kolejek przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika moderatora lub administratora.

Parametry zapytania:

- `status` (opcjonalne): `open` (domyślnie), `blocked`, `manual` lub `all`
- `limit` (opcjonalne): liczba całkowita (1-100)
- `cursor` (opcjonalne): kursor paginacji

Znaczenia statusów:

- `open`: podejrzane, złośliwe, oczekujące, poddane kwarantannie, cofnięte lub zgłoszone wydania.
- `blocked`: wydania poddane kwarantannie, cofnięte lub złośliwe.
- `manual`: każde wydanie z ręcznym zastąpieniem moderacji.
- `all`: każde wydanie z ręcznym zastąpieniem, nieczystym stanem skanowania lub zgłoszeniem pakietu.

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

Zgłasza pakiet do przeglądu przez moderatora. Zgłoszenia dotyczą poziomu pakietu i opcjonalnie
są powiązane z wersją. Zasilają kolejkę moderacji, ale same nie ukrywają automatycznie ani
nie blokują pobrań; moderatorzy powinni używać moderacji wydań, aby
zatwierdzać, poddawać kwarantannie lub cofać artefakty.

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

- Wymaga tokenu API użytkownika moderatora lub administratora.

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

Endpoint właściciela/moderatora do wglądu w moderację pakietu.

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
- `quarantined`: zablokowane do czasu dalszych działań.
- `revoked`: zablokowane po tym, jak wydanie było wcześniej zaufane.

Wydania w kwarantannie i wycofane zwracają `403` z tras pobierania artefaktów.
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
- Oczekujące skany VirusTotal nie blokują odczytów; złośliwe wydania mogą nadal być wstrzymywane gdzie indziej.
- Pakiety prywatne zwracają `404`, chyba że wywołujący może odczytać właścicielskiego wydawcę.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze deterministyczne archiwum ZIP dla wydania pakietu.

Parametry zapytania:

- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa Plugin/pakietu są plikami zip z katalogiem głównym `package/`, aby stare klienty OpenClaw
  nadal działały.
- Ta trasa pozostaje wyłącznie ZIP. Nie strumieniuje plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` i
  `X-ClawHub-Artifact-Sha256` do sprawdzania integralności resolvera.
- Metadane wyłącznie z rejestru nie są wstrzykiwane do pobieranego archiwum.
- Oczekujące skany VirusTotal nie blokują pobrań; złośliwe wydania zwracają `403`.
- Pakiety prywatne zwracają `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca zgodny z npm packument dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wymienione są tylko wersje z przesłanymi tarballami ClawPack npm-pack.
- Starsze wersje wyłącznie ZIP są celowo pomijane.
- `dist.tarball`, `dist.integrity` i `dist.shasum` używają pól zgodnych z npm,
  aby użytkownicy mogli wskazać npm kopię lustrzaną, jeśli zechcą.
- Packumenty pakietów zakresowych obsługują zarówno `/api/npm/@scope/name`, jak i zakodowaną
  ścieżkę żądania npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Strumieniuje dokładne bajty przesłanego tarballa ClawPack dla klientów kopii lustrzanej npm.

Uwagi:

- Używa limitu szybkości pobierania.
- Nagłówki pobierania zawierają SHA-256 ClawHub oraz metadane integralności/shasum npm.
- Nadal obowiązują kontrole moderacji i dostępu do pakietów prywatnych.

### `GET /api/v1/resolve`

Używane przez CLI do mapowania lokalnego odcisku palca na znaną wersję.

Parametry zapytania:

- `slug` (wymagany)
- `hash` (wymagany): 64-znakowy szesnastkowy sha256 odcisku palca pakietu

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera hostowaną wersję ZIP umiejętności albo zwraca przekazanie źródła GitHub dla
bieżącej umiejętności opartej na GitHub ze skanem `clean` lub `suspicious` i bez hostowanej
wersji.

Parametry zapytania:

- `slug` (wymagany)
- `version` (opcjonalny): ciąg semver
- `tag` (opcjonalny): nazwa tagu (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Wersje miękko usunięte zwracają `410`.
- Przekazania umiejętności opartych na GitHub nie pośredniczą ani nie mirrorują bajtów. Odpowiedź JSON
  zawiera `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  i `archiveUrl`; stan skanowania/bieżący jest bramką i nie jest dołączany jako metadane
  ładunku sukcesu.
- Statystyki pobrań są liczone jako unikalne tożsamości na dzień UTC (`userId`, gdy token API jest poprawny, w przeciwnym razie IP).

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
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, API rozwiązuje tego
  wydawcę po stronie serwera i wymaga, aby aktor miał dostęp do wydawcy.
- Opcjonalne pole ładunku: `migrateOwner`. Gdy ma wartość `true` z `ownerHandle`, istniejąca
  umiejętność może zostać przeniesiona do tego właściciela, jeśli aktor jest administratorem/właścicielem u obu
  wydawców: obecnego i docelowego. Bez tej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie code-plugin lub bundle-plugin.

- Wymaga uwierzytelniania tokenem Bearer.
- Wymaga `multipart/form-data`.
- Dozwolone pola formularza to `payload`, powtarzane bloby `files` albo jedna referencja tarballa
  `clawpack`. `clawpack` może być blobem `.tgz` lub identyfikatorem storage id zwróconym przez
  przepływ upload-url. Publikacje z przygotowanego storage-id muszą również zawierać
  `clawpackUploadTicket` zwrócony z tym URL-em przesyłania.
- Użyj albo `files`, albo `clawpack`, nigdy obu w tym samym żądaniu.
- Treści JSON i dostarczone przez wywołującego metadane `payload.files` / `payload.artifact`
  są odrzucane.
- Bezpośrednie żądania publikacji multipart są ograniczone do 18 MB. Tarballe ClawPack mogą
  używać przepływu upload-url do limitu tarballa 120 MB.
- Opcjonalne pole ładunku: `ownerHandle`. Gdy jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze elementy walidacji:

- `family` musi być `code-plugin` lub `bundle-plugin`.
- Pakiety Plugin wymagają `openclaw.plugin.json`. Przesyłane pliki ClawPack `.tgz` muszą
  zawierać go w `package/openclaw.plugin.json`.
- Code plugins wymagają `package.json`, metadanych repozytorium źródłowego, metadanych commita źródłowego,
  metadanych schematu konfiguracji, `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` są opcjonalnymi metadanymi.
- Tylko wydawca organizacji `openclaw` oraz osobiści wydawcy obecnych członków organizacji `openclaw`
  mogą publikować do kanału `official`.
- Publikacje w czyimś imieniu nadal walidują uprawnienia do kanału official względem konta właściciela docelowego.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękko usuwa / przywraca umiejętność (właściciel, moderator lub administrator).

Opcjonalna treść JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Gdy jest obecne, `reason` jest przechowywane jako notatka moderacyjna umiejętności i kopiowane do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują slug na 30 dni, po czym slug może zostać przejęty przez
innego wydawcę. Odpowiedź usunięcia zawiera `slugReservedUntil`, gdy ten termin wygaśnięcia ma zastosowanie.
Ukrycia moderatora/administratora i usunięcia bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź usunięcia:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Kody statusu:

- `200`: ok
- `401`: nieuwierzytelniony
- `403`: zabronione
- `404`: nie znaleziono umiejętności/użytkownika
- `500`: wewnętrzny błąd serwera

### `POST /api/v1/users/publisher`

Tylko administrator. Zapewnia istnienie wydawcy organizacyjnego dla uchwytu. Jeśli uchwyt nadal wskazuje na
starszego wspólnego użytkownika/osobistego wydawcę, endpoint najpierw migruje go do wydawcy organizacyjnego.
Dla nowo utworzonej organizacji podaj `memberHandle`; działający administrator nie jest dodawany jako członek.
`memberRole` domyślnie przyjmuje `owner`.

- Treść: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Uwierzytelnione samoobsługowe tworzenie wydawcy organizacyjnego. Tworzy nowego wydawcę organizacyjnego i dodaje
wywołującego jako właściciela. Ten endpoint nie migruje istniejących uchwytów użytkowników/osobistych i
nie oznacza wydawcy jako zaufanego/oficjalnego.

- Treść: `{ "handle": "opik", "displayName": "Opik" }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Zwraca `409`, gdy uchwyt jest już używany przez wydawcę, użytkownika lub osobistego wydawcę.

### `POST /api/v1/users/reserve`

Tylko administrator. Rezerwuje główne slugi i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, więc ten sam
właściciel może później opublikować rzeczywiste wydanie code-plugin lub bundle-plugin pod tą nazwą.

- Treść: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Tylko administrator. Odzyskuje osobistego wydawcę dla zweryfikowanego zastępczego podmiotu głównego GitHub OAuth
bez edytowania wierszy kont Convex Auth. Żądanie musi wskazywać oba niezmienne identyfikatory kont dostawcy
GitHub; zmienne uchwyty są używane tylko jako zabezpieczenie widoczne dla operatora.

Punkt końcowy domyślnie działa w trybie próbnym. Zastosowanie odzyskiwania wymaga `dryRun: false` oraz
`confirmIdentityVerified: true` po tym, jak personel niezależnie zweryfikuje ciągłość między oboma
podmiotami GitHub. Odzyskiwanie kończy się odmową, gdy bieżący osobisty
wydawca użytkownika docelowego ma skills, pakiety lub źródła skill GitHub.
Odzyskiwanie migruje też starsze pola `ownerUserId` dla skills odzyskiwanego wydawcy,
aliasów slugów skill, pakietów, ostrzeżeń inspektora pakietów oraz pochodnych wierszy skrótu wyszukiwania, tak aby
ścieżki bezpośredniego właściciela zgadzały się z nowym uprawnieniem wydawcy. Aktywna rezerwacja chronionej nazwy użytkownika
dla odzyskiwanej nazwy jest także ponownie przypisywana do użytkownika zastępczego, aby późniejsza
synchronizacja profilu nie mogła przywrócić konkurencyjnego uprawnienia poprzedniego użytkownika. Każda tabela główna jest ograniczona do
100 wierszy na transakcję zastosowania; większe odzyskiwania muszą najpierw użyć wznawialnej migracji właściciela.
Źródła skill GitHub są powiązane z wydawcą i zgłaszane jako sprawdzone, a nie przepisywane.

- Treść żądania: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Odpowiedź: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Punkty końcowe zarządzania slugami właściciela

- `POST /api/v1/skills/{slug}/rename`
  - Treść żądania: `{ "newSlug": "new-canonical-slug" }`
  - Odpowiedź: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Treść żądania: `{ "targetSlug": "canonical-target-slug" }`
  - Odpowiedź: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Uwagi:

- Oba punkty końcowe wymagają uwierzytelniania tokenem API i działają tylko dla właściciela skill.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje slug źródłowy do wpisu docelowego.

### Punkty końcowe przenoszenia własności

- `POST /api/v1/skills/{slug}/transfer`
  - Treść żądania: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Odpowiedź: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Odpowiedź (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Kształt odpowiedzi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Zablokuj użytkownika i trwale usuń posiadane skills (tylko moderator/administrator).

Treść żądania:

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

Odblokuj użytkownika i przywróć kwalifikujące się skills (tylko administrator).

Treść żądania:

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

Treść żądania:

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

Treść żądania:

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

- `q` (opcjonalnie): zapytanie wyszukiwania
- `query` (opcjonalnie): alias dla `q`
- `limit` (opcjonalnie): maksymalna liczba wyników (domyślnie 20, maks. 200)

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

Plan usunięcia znajdziesz w `DEPRECATIONS.md`.

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
