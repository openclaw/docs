---
read_when:
    - Dodawanie/zmienianie punktów końcowych
    - Debugowanie żądań CLI ↔ rejestr
summary: Dokumentacja interfejsu HTTP API (publiczne punkty końcowe, punkty końcowe CLI i uwierzytelnianie).
x-i18n:
    generated_at: "2026-07-12T14:51:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Bazowy adres URL: `https://clawhub.ai` (domyślnie).

Wszystkie ścieżki v1 znajdują się pod `/api/v1/...`.
Starsze ścieżki `/api/...` i `/api/cli/...` pozostają dostępne w celu zachowania zgodności (zobacz `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Ponowne wykorzystywanie publicznego katalogu

Katalogi zewnętrzne mogą używać publicznych punktów końcowych odczytu do wyświetlania lub wyszukiwania Skills w ClawHub. Należy buforować wyniki, respektować `429`/`Retry-After`, kierować użytkowników do kanonicznej strony wpisu w ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) i unikać sugerowania, że ClawHub rekomenduje zewnętrzną witrynę. Nie należy próbować odzwierciedlać ukrytych, prywatnych ani zablokowanych przez moderację treści poza publicznym interfejsem API.

Skróty slugów w adresach internetowych są rozpoznawane w różnych rodzinach rejestru, ale klienci API powinni używać kanonicznych adresów URL zwracanych przez punkty końcowe odczytu, zamiast samodzielnie odtwarzać kolejność rozstrzygania tras.

## Limity szybkości

Model egzekwowania:

- Żądania anonimowe: limit egzekwowany osobno dla każdego adresu IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): limit egzekwowany osobno dla każdego użytkownika.
- Jeśli brakuje tokenu lub jest on nieprawidłowy, stosowany jest limit dla adresu IP.
- Uwierzytelnione punkty końcowe zapisu nie powinny zwracać samego komunikatu `Unauthorized`, gdy serwer zna przyczynę. Brakujące tokeny, nieprawidłowe lub unieważnione tokeny oraz usunięte, zbanowane lub wyłączone konta powinny otrzymywać komunikaty umożliwiające podjęcie działania, aby klienci CLI mogli poinformować użytkowników, co spowodowało blokadę.

- Odczyt: 3000/min na adres IP, 12000/min na klucz
- Zapis: 300/min na adres IP, 3000/min na klucz
- Pobieranie: 1200/min na adres IP, 6000/min na klucz (punkty końcowe pobierania)

Nagłówki:

- Zgodność wsteczna: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Ustandaryzowane: `RateLimit-Limit`, `RateLimit-Reset`
- Przy `429`: `X-RateLimit-Remaining: 0` i `RateLimit-Remaining: 0`
- Przy `429`: `Retry-After`

Znaczenie nagłówków:

- `X-RateLimit-Reset`: bezwzględny czas uniksowy w sekundach
- `RateLimit-Reset`: liczba sekund do wyzerowania limitu (opóźnienie)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały limit, jeśli nagłówek jest obecny.
  Pomyślnie obsłużone żądania rozproszone między fragmentami pomijają ten nagłówek zamiast zwracać przybliżoną wartość globalną.
- `Retry-After`: liczba sekund oczekiwania przed ponowieniem żądania (opóźnienie) przy `429`

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

Przekroczono limit szybkości
```

Wskazówki dla klientów:

- Jeśli istnieje `Retry-After`, przed ponowieniem żądania należy odczekać podaną liczbę sekund.
- Należy używać wykładniczego wycofywania z losowym rozrzutem, aby uniknąć zsynchronizowanych ponowień.
- Jeśli brakuje `Retry-After`, należy użyć `RateLimit-Reset` (lub obliczyć czas na podstawie `X-RateLimit-Reset`).

Źródło adresu IP:

- Zaufane nagłówki adresu IP klienta, w tym `cf-connecting-ip`, są używane tylko wtedy, gdy wdrożenie jawnie włącza zaufane nagłówki przekazywane.
- ClawHub używa zaufanych nagłówków przekazywania do identyfikowania adresów IP klientów na brzegu sieci.
- Jeśli zaufany adres IP klienta nie jest dostępny, żądania anonimowe korzystają z pul zastępczych ograniczonych wyłącznie do rodzaju limitu szybkości. Te pule zastępcze nie obejmują ścieżek, slugów, nazw pakietów, wersji, ciągów zapytań ani innych parametrów artefaktów dostarczonych przez wywołującego.

## Odpowiedzi błędów

Publiczne odpowiedzi błędów v1 są zwykłym tekstem z `content-type: text/plain; charset=utf-8`.
Obejmuje to błędy walidacji (`400`), brakujące zasoby publiczne (`404`), błędy uwierzytelniania i uprawnień (`401`/`403`), limity szybkości (`429`) oraz zablokowane pobierania. Klienci powinni odczytywać treść odpowiedzi jako tekst przeznaczony dla człowieka. Nieznane parametry zapytania są ignorowane w celu zachowania zgodności, ale rozpoznane parametry zapytania o nieprawidłowych wartościach powodują zwrócenie `400`.

## Publiczne punkty końcowe (bez uwierzytelniania)

### `GET /api/v1/search`

Parametry zapytania:

- `q` (wymagany): ciąg zapytania
- `limit` (opcjonalny): liczba całkowita
- `highlightedOnly` (opcjonalny): `true`, aby ograniczyć wyniki do wyróżnionych Skills
- `nonSuspiciousOnly` (opcjonalny): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalny): starszy alias dla `nonSuspiciousOnly`

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

- Wyniki są zwracane w kolejności trafności (podobieństwo osadzeń + premie za dokładne dopasowanie tokenów sluga/nazwy + niewielki priorytet popularności).
- Trafność ma większe znaczenie niż popularność. Dokładne dopasowanie tokenu sluga lub nazwy wyświetlanej może wyprzedzić luźniejsze dopasowanie o znacznie większym zaangażowaniu.
- Tekst ASCII jest dzielony na tokeny na granicach słów i znaków interpunkcyjnych. Na przykład `personal-map` zawiera samodzielny token `map`, natomiast `amap-jsapi-skill` zawiera tokeny `amap`, `jsapi` i `skill`; dlatego wyszukiwanie `map` daje `personal-map` silniejsze dopasowanie leksykalne niż `amap-jsapi-skill`.
- Popularność jest skalowana logarytmicznie i ograniczana. Skills o wysokim zaangażowaniu mogą zajmować niższe pozycje, gdy tekst zapytania jest słabiej dopasowany.
- Podejrzany lub ukryty stan moderacji może usunąć Skill z publicznych wyników wyszukiwania w zależności od filtrów wywołującego i bieżącego stanu moderacji.

Wskazówki dotyczące wykrywalności dla wydawców:

- Terminy, których użytkownicy będą dosłownie szukać, należy umieścić w nazwie wyświetlanej, podsumowaniu i tagach. Samodzielnego tokenu sluga należy używać tylko wtedy, gdy jest on również stabilnym identyfikatorem, który ma zostać zachowany.
- Nie należy zmieniać sluga wyłącznie po to, aby uzyskać lepszy wynik dla jednego zapytania, chyba że nowy slug jest lepszą długoterminową nazwą kanoniczną. Stare slugi stają się aliasami przekierowań, ale kanoniczny adres URL, wyświetlany slug i przyszłe zestawienia wyszukiwania używają nowego sluga.
- Aliasy powstałe po zmianie nazwy zachowują możliwość rozpoznawania starych adresów URL i instalacji rozwiązywanych przez rejestr, ale ranking wyszukiwania opiera się na kanonicznych metadanych Skill po zindeksowaniu zmiany nazwy. Istniejące statystyki pozostają przypisane do Skill.
- Jeśli Skill jest nieoczekiwanie niewidoczny, przed zmianą metadanych związanych z rankingiem należy najpierw sprawdzić stan moderacji za pomocą `clawhub inspect @owner/slug` po zalogowaniu.

### `GET /api/v1/skills`

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–200)
- `cursor` (opcjonalny): kursor stronicowania dla dowolnego sortowania innego niż `trending`
- `sort` (opcjonalny): `updated` (domyślnie), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` są mapowane na `downloads`, `trending`
- `nonSuspiciousOnly` (opcjonalny): `true`, aby ukryć podejrzane (`flagged.suspicious`) Skills
- `nonSuspicious` (opcjonalny): starszy alias dla `nonSuspiciousOnly`

Nieprawidłowe wartości `sort` powodują zwrócenie `400`.

Uwagi:

- `recommended` wykorzystuje sygnały zaangażowania i aktualności.
- `trending` szereguje według instalacji z ostatnich 7 dni (na podstawie telemetrii).
- `createdAt` jest stabilne przy indeksowaniu nowych Skills; `updated` zmienia się po ponownym opublikowaniu istniejących Skills.
- Gdy `nonSuspiciousOnly=true`, sortowania oparte na kursorze mogą zwrócić na stronie mniej niż `limit` elementów, ponieważ podejrzane Skills są filtrowane po pobraniu strony.
- Jeśli `nextCursor` jest obecny, należy go użyć do kontynuowania stronicowania. Krótka strona sama w sobie nie oznacza końca wyników.

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

- Stare slugi utworzone w wyniku zmiany nazwy lub scalenia przez właściciela są rozpoznawane jako kanoniczny Skill.
- `metadata.os`: ograniczenia systemu operacyjnego zadeklarowane w metadanych początkowych Skill (np. `["macos"]`, `["linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata.systems`: docelowe systemy Nix (np. `["aarch64-darwin", "x86_64-linux"]`). `null`, jeśli nie zadeklarowano.
- `metadata` ma wartość `null`, jeśli Skill nie ma metadanych platformy.
- `moderation` jest uwzględniane tylko wtedy, gdy Skill został oznaczony lub jest wyświetlany przez właściciela.

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
- Publiczni wywołujący otrzymują `200` tylko dla widocznych Skills, które zostały już oznaczone.
- Materiał dowodowy jest redagowany dla publicznych wywołujących i zawiera nieprzetworzone fragmenty wyłącznie dla właścicieli oraz moderatorów.

### `POST /api/v1/skills/{slug}/report`

Zgłasza Skill do sprawdzenia przez moderatora. Zgłoszenia dotyczą całego Skill, mogą być opcjonalnie powiązane z wersją i trafiają do kolejki zgłoszeń Skills.

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
- `cursor` (opcjonalny): kursor stronicowania

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

Punkt końcowy moderatora/administratora do rozstrzygania lub ponownego otwierania zgłoszeń Skills.

Żądanie:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas ponownego ustawiania `status` na `open`. Przekazanie `finalAction: "hide"` wraz z rozpatrzonym zgłoszeniem ukrywa Skill w ramach tego samego audytowalnego procesu.

### `GET /api/v1/skills/{slug}/versions`

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita
- `cursor` (opcjonalny): kursor stronicowania

### `GET /api/v1/skills/{slug}/versions/{version}`

Zwraca metadane wersji i listę plików.

- `version.security` zawiera znormalizowany stan weryfikacji skanowania oraz szczegóły skanerów
  (VirusTotal + LLM), jeśli są dostępne.

### `GET /api/v1/skills/{slug}/scan`

Zwraca szczegóły weryfikacji skanowania bezpieczeństwa wersji Skill.

Parametry zapytania:

- `version` (opcjonalny): określony ciąg wersji.
- `tag` (opcjonalny): rozpoznaje wersję oznaczoną tagiem (na przykład `latest`).

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Obejmuje znormalizowany stan weryfikacji oraz szczegóły specyficzne dla skanera.
- `security.hasScanResult` ma wartość `true` tylko wtedy, gdy skaner wydał jednoznaczny werdykt (`clean`, `suspicious` lub `malicious`).
- `moderation` to bieżący obraz stanu moderacji na poziomie Skills, utworzony na podstawie najnowszej wersji.
- Podczas odpytywania o wersję historyczną sprawdź `moderation.matchesRequestedVersion` i `moderation.sourceVersion`, zanim uznasz `moderation` i `security` za dane dotyczące tej samej wersji.

### `POST /api/v1/skills/-/scan`

Uwierzytelniony punkt końcowy przesyłania nowych zadań ClawScan.

Skanowanie lokalnie przesyłanych plików nie jest już obsługiwane. Żądania używające
`multipart/form-data` lub `{ "source": { "kind": "upload" } }` zwracają `410`.

Skanowanie opublikowanych wersji korzysta z formatu JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Uwagi:

- Ładunki żądań skanowania i raporty do pobrania wygasają w magazynie żądań skanowania po upływie okresu przechowywania.
- Skanowanie opublikowanych wersji wymaga uprawnień właściciela lub wydawcy do zarządzania albo uprawnień moderatora lub administratora platformy.
- Wyniki skanowania opublikowanych wersji są zapisywane zwrotnie tylko wtedy, gdy `update: true`, a skanowanie zakończy się pomyślnie.
- Odpowiedź ma kod `202` i postać `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Zadania skanowania są asynchroniczne. Ręczne żądania skanowania mają wyższy priorytet niż zwykłe zadania publikowania i uzupełniania danych, ale czas ich ukończenia nadal zależy od dostępności procesów roboczych.

### `GET /api/v1/skills/-/scan/{scanId}`

Uwierzytelniony punkt końcowy odpytywania o stan przesłanego skanowania.

- Zwraca stan oczekiwania, wykonywania, powodzenia lub niepowodzenia.
- Podczas oczekiwania zwraca `queue.queuedAhead` i `queue.position`, aby klient mógł pokazać, ile priorytetowych skanowań ręcznych znajduje się przed tym żądaniem. Bardzo duże kolejki są ograniczane, a ich wartości zgłaszane z `queuedAheadIsEstimate: true`.
- Gdy dane są dostępne, `report` zawiera sekcje `clawscan`, `skillspector`, `staticAnalysis` i `virustotal`.
- Zadania skanowania zakończone niepowodzeniem zwracają `status: "failed"` wraz z `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Uwierzytelniony punkt końcowy archiwum raportu.

- Wymaga pomyślnie zakończonego skanowania; skanowania, które nie osiągnęły stanu końcowego, zwracają `409`.
- Zwraca archiwum ZIP zawierające `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` i `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Uwierzytelniony punkt końcowy przechowywanego archiwum raportu dla przesłanych wersji.

- Wymaga uprawnień właściciela lub wydawcy do zarządzania daną Skills lub pluginem albo uprawnień moderatora lub administratora platformy.
- Zwraca przechowywane wyniki skanowania dla dokładnie wskazanej przesłanej wersji, w tym wersji zablokowanych lub ukrytych.
- Domyślna wartość `kind` to `skill`; dla skanowania pluginów lub pakietów użyj `kind=plugin`.
- Zwraca archiwum ZIP o takiej samej strukturze jak pliki pobierane dla żądań skanowania.

### `POST /api/v1/skills/-/scan/batch`

Kanoniczna trasa administratora do ponownego skanowania wsadowego. Przyjmuje ładunek o takiej samej strukturze jak starsza trasa `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Kanoniczna trasa administratora do sprawdzania stanu zadania wsadowego. Przyjmuje `{ "jobIds": ["..."] }` i zwraca takie same liczniki zbiorcze jak starsza trasa `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Zwraca kopertę weryfikacji karty Skills używaną przez `clawhub skill verify`.

Parametry zapytania:

- `version` (opcjonalny): ciąg znaków określający konkretną wersję.
- `tag` (opcjonalny): rozpoznanie wersji oznaczonej tagiem, na przykład `latest`.

Uwagi:

- `ok` ma wartość `true` tylko wtedy, gdy wybrana wersja ma wygenerowaną kartę Skills, nie została zablokowana przez moderację jako złośliwe oprogramowanie, a weryfikacja ClawScan ma stan `clean`.
- Tożsamość Skills, tożsamość wydawcy i metadane wybranej wersji są polami najwyższego poziomu koperty (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), dzięki czemu automatyzacja powłoki może je odczytać bez rozpakowywania zagnieżdżonych opakowań.
- `security` to werdykt ClawScan dotyczący bezpieczeństwa na najwyższym poziomie. Automatyzacja powinna opierać się na `ok`, `decision`, `reasons` i `security.status`.
- `security.signals` zawiera pomocnicze dowody ze skanerów, takie jak `staticScan`, `virusTotal` i `skillSpector`.
- `security.signals.dependencyRegistry` zachowano ze względu na zgodność odpowiedzi v1, ale skaner sprawdzający istnienie rejestru zależności został wycofany, dlatego ten klucz zawsze ma wartość `null`.
- `provenance` ma wartość `server-resolved-github-import` tylko wtedy, gdy ClawHub rozpoznał i zapisał repozytorium, referencję, commit oraz ścieżkę GitHub podczas publikowania lub importowania; w przeciwnym razie ma wartość `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Zwraca bieżące, skrócone werdykty bezpieczeństwa dla dokładnych wersji Skills. Ten
punkt końcowy kolekcji jest przeznaczony dla klientów, którzy już wiedzą, które wersje
zainstalowanych Skills ClawHub muszą wyświetlić, na przykład interfejs sterowania OpenClaw.

Żądanie:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Uwagi:

- `items` musi zawierać od 1 do 100 unikatowych par `{ slug, version }`.
- Wyniki są zwracane osobno dla każdego elementu; brak jednej Skills lub wersji nie powoduje niepowodzenia całej odpowiedzi.
- Odpowiedź zawiera wyłącznie informacje dotyczące bezpieczeństwa. Nie obejmuje danych karty Skills, stanu wygenerowanej karty, list plików artefaktu ani szczegółowych ładunków skanerów.
- `security.signals` zawiera tylko pomocnicze dowody na poziomie stanu; pełne szczegóły skanerów są dostępne przez `/scan` lub na stronie audytu bezpieczeństwa ClawHub.
- `security.signals.dependencyRegistry` zachowano ze względu na zgodność odpowiedzi v1, ale skaner sprawdzający istnienie rejestru zależności został wycofany, dlatego ten klucz zawsze ma wartość `null`.
- Brak karty Skills nie wpływa na wartości `ok`, `decision` ani `reasons` tego punktu końcowego; gdy klient potrzebuje treści karty, powinien lokalnie odczytać zainstalowany plik `skill-card.md`.
- Użyj `/verify`, gdy potrzebujesz koperty weryfikacji karty Skills dla pojedynczej Skills, `/card`, gdy potrzebujesz wygenerowanej karty w formacie Markdown, oraz `/scan`, gdy potrzebujesz szczegółowych danych skanerów.

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

Zwraca nieprzetworzoną treść tekstową.

Parametry zapytania:

- `path` (wymagany)
- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używana jest najnowsza wersja.
- Limit rozmiaru pliku: 200 KB.

### `GET /api/v1/packages`

Ujednolicony punkt końcowy katalogu dla:

- Skills
- Pluginów kodu
- Pluginów pakietowych

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–100)
- `cursor` (opcjonalny): kursor stronicowania
- `family` (opcjonalny): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalny): `official`, `community` lub `private`
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `updated` (domyślnie), `recommended`, `trending`, `downloads`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii Pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest ograniczone do pakietów Pluginów (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` lub punktów końcowych pakietów z
  `family=code-plugin`/`family=bundle-plugin`). Kontrolowane kategorie i
  starsze aliasy filtrów v1 opisano w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości parametrów `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` lub `sort` powodują zwrócenie kodu `400`. Nieznane parametry zapytania są ignorowane.
- `GET /api/v1/code-plugins` i `GET /api/v1/bundle-plugins` pozostają aliasami ze stałą rodziną.
- Wpisy Skills nadal korzystają z rejestru Skills i wciąż mogą być publikowane wyłącznie przez `POST /api/v1/skills`.
- `POST /api/v1/packages` nadal służy wyłącznie do publikowania wydań Pluginów kodu i Pluginów pakietowych.
- Anonimowi wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą zobaczyć w wynikach listowania i wyszukiwania prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca wyłącznie pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/packages/search`

Ujednolicone wyszukiwanie w katalogu obejmujące Skills i pakiety Pluginów.

Parametry zapytania:

- `q` (wymagany): ciąg wyszukiwania
- `limit` (opcjonalny): liczba całkowita (1–100)
- `family` (opcjonalny): `skill`, `code-plugin` lub `bundle-plugin`
- `channel` (opcjonalny): `official`, `community` lub `private`
- `isOfficial` (opcjonalny): `true` lub `false`
- `category` (opcjonalny): filtr kategorii Pluginów. Obsługiwany tylko wtedy, gdy
  żądanie jest ograniczone do pakietów Pluginów. Kontrolowane kategorie i starsze aliasy
  filtrów v1 opisano w sekcji `GET /api/v1/plugins`.

Uwagi:

- Nieprawidłowe wartości parametrów `family`, `channel`, `isOfficial`, `featured` lub
  `highlightedOnly` powodują zwrócenie kodu `400`. Nieznane parametry zapytania są ignorowane.
- Anonimowi wywołujący widzą tylko publiczne kanały pakietów.
- Uwierzytelnieni wywołujący mogą wyszukiwać prywatne pakiety wydawców, do których należą.
- `channel=private` zwraca wyłącznie pakiety, które uwierzytelniony wywołujący może odczytać.

### `GET /api/v1/plugins`

Przeglądanie katalogu wyłącznie Pluginów, obejmującego pakiety Pluginów kodu i Pluginów pakietowych.

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1-100)
- `cursor` (opcjonalny): kursor stronicowania
- `isOfficial` (opcjonalny): `true` lub `false`
- `sort` (opcjonalny): `recommended` (domyślnie), `trending`, `downloads`, `updated`, starszy alias `installs`
- `category` (opcjonalny): filtr kategorii Pluginów. Aktualne wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Starsze aliasy filtrów v1 są nadal akceptowane w punktach końcowych odczytu:

- `mcp-tooling`, `data` i `automation` są rozpoznawane jako `tools`.
- `observability` i `deployment` są rozpoznawane jako `gateway`.
- `dev-tools` jest rozpoznawany jako `runtime`.

`trending` to ranking instalacji i pobrań z siedmiu dni, który nie korzysta z łącznych danych historycznych.
W ujednoliconym punkcie końcowym `/api/v1/packages` dotyczy wyłącznie Pluginów; dla katalogu
Skills użyj `/api/v1/skills?sort=trending`.

Starsze aliasy nie są akceptowane jako przechowywane ani deklarowane przez autora wartości kategorii.

### `GET /api/v1/skills/export`

Zbiorczy eksport najnowszych publicznych Skills do analizy offline.

Uwierzytelnianie:

- Wymagany token API.

Parametry zapytania:

- `startDate` (wymagany): dolna granica czasu `updatedAt` Skills w milisekundach uniksowych.
- `endDate` (wymagany): górna granica czasu `updatedAt` Skills w milisekundach uniksowych.
- `limit` (opcjonalny): liczba całkowita (1-250), domyślnie `250`.
- `cursor` (opcjonalny): kursor stronicowania z poprzedniej odpowiedzi.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany Skill znajduje się w katalogu głównym `{publisher}/{slug}/`.
- Skills hostowane w usłudze zawierają pliki najnowszej przechowywanej wersji i są wymienione w
  `_manifest.json` z wartością `sourceRef: "public-clawhub"`.
- Bieżące Skills oparte na GitHubie, których wynik skanowania to `clean` lub `suspicious`, zawierają
  `_source_handoff.json` z wartością `sourceRef: "public-github"`, repozytorium, commitem, ścieżką,
  skrótem treści i adresem URL archiwum. Nie zawierają plików źródłowych hostowanych przez ClawHub.
- Każdy Skill zawiera `_export_skill_meta.json`.
- `_manifest.json` jest zawsze umieszczany w katalogu głównym archiwum ZIP.
- `_errors.json` jest dołączany, gdy nie udało się wyeksportować poszczególnych Skills lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Zbiorczy eksport najnowszych publicznych wydań pluginów do analizy offline.

Uwierzytelnianie:

- Wymagany jest token API.

Parametry zapytania:

- `startDate` (wymagany): dolna granica `updatedAt` pluginu w milisekundach czasu uniksowego.
- `endDate` (wymagany): górna granica `updatedAt` pluginu w milisekundach czasu uniksowego.
- `limit` (opcjonalny): liczba całkowita (1–250), domyślnie `250`.
- `cursor` (opcjonalny): kursor stronicowania z poprzedniej odpowiedzi.
- `family` (opcjonalny): `code-plugin` lub `bundle-plugin`. Pominięcie oznacza obie
  rodziny pluginów.

Odpowiedź:

- Treść: archiwum ZIP.
- Każdy wyeksportowany plugin znajduje się w katalogu głównym `{family}/{packageName}/`.
- Każdy wyeksportowany plugin zawiera zapisane pliki najnowszego wydania.
- Metadane eksportu poszczególnych pluginów są przechowywane w
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- Plik `_manifest.json` jest zawsze dołączany w katalogu głównym archiwum ZIP.
- Plik `_errors.json` jest dołączany, gdy nie udało się wyeksportować
  poszczególnych pluginów lub plików.

Nagłówki:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Wyszukiwanie wyłącznie pluginów w pakietach typu code-plugin i bundle-plugin.

Parametry zapytania:

- `q` (wymagany): ciąg zapytania
- `limit` (opcjonalny): liczba całkowita (1–100)
- `isOfficial` (opcjonalny): `true` lub `false`
- `category` (opcjonalny): filtr kategorii pluginów. Obecne wartości:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Uwagi:

- Akceptowane są również starsze aliasy filtrów v1 udokumentowane w sekcji
  `GET /api/v1/plugins`.
- Filtrowanie według kategorii jest rzeczywistym filtrem API opartym na wierszach
  skrótów kategorii pluginów, a nie przekształceniem zapytania wyszukiwania.
- Wyniki są zwracane według trafności i obecnie nie są stronicowane.
- Elementy sterujące sortowaniem wyszukiwania pluginów w interfejsie przeglądarkowym
  zmieniają kolejność wczytanych wyników według trafności, zgodnie z obecnym
  działaniem przeglądania `/skills`.

### `GET /api/v1/packages/{name}`

Zwraca szczegółowe metadane pakietu.

Uwagi:

- Skills mogą być również rozpoznawane przez tę trasę w ujednoliconym katalogu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący ma uprawnienia do odczytu
  właściciela publikującego.

### `DELETE /api/v1/packages/{name}`

Wykonuje miękkie usunięcie pakietu i wszystkich wydań.

Uwagi:

- Wymaga tokenu API właściciela pakietu, właściciela lub administratora
  organizacji publikującej, moderatora platformy albo administratora platformy.

### `GET /api/v1/packages/{name}/versions`

Zwraca historię wersji.

Parametry zapytania:

- `limit` (opcjonalny): liczba całkowita (1–100)
- `cursor` (opcjonalny): kursor stronicowania

Uwagi:

- Pakiety prywatne zwracają `404`, chyba że wywołujący ma uprawnienia do odczytu
  właściciela publikującego.

### `GET /api/v1/packages/{name}/versions/{version}`

Zwraca jedną wersję pakietu, w tym metadane plików, zgodność,
weryfikację, metadane artefaktu i dane skanowania.

Uwagi:

- `version.artifact.kind` ma wartość `legacy-zip` dla archiwów pakietów starego
  typu lub `npm-pack` dla wydań opartych na ClawPack.
- Wydania ClawPack zawierają zgodne z npm pola `npmIntegrity`, `npmShasum` oraz
  `npmTarballName`.
- `version.sha256hash` to przestarzałe metadane zgodności dla starszych klientów.
  Pole to zawiera skrót dokładnych bajtów ZIP zwracanych przez
  `/api/v1/packages/{name}/download`. Nowoczesne klienty powinny używać
  `version.artifact.sha256`, które identyfikuje kanoniczny artefakt wydania.
- Pola `version.vtAnalysis`, `version.llmAnalysis` oraz `version.staticScan` są
  dołączane, gdy istnieją dane skanowania.
- Pakiety prywatne zwracają `404`, chyba że wywołujący ma uprawnienia do odczytu
  właściciela publikującego.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Zwraca dokładne podsumowanie bezpieczeństwa i zaufania wydania pakietu dla
klientów instalacyjnych. Jest to publiczny interfejs OpenClaw służący do
decydowania, czy rozpoznane wydanie może zostać zainstalowane.

Uwierzytelnianie:

- Publiczny punkt końcowy do odczytu. Token właściciela, publikującego,
  moderatora ani administratora nie jest wymagany.

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

- `package.name`, `package.displayName` oraz `package.family` identyfikują
  rozpoznany pakiet rejestru.
- `release.releaseId`, `release.version` oraz `release.createdAt` identyfikują
  dokładne wydanie poddane ocenie.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` oraz `release.npmTarballName` są obecne, gdy są znane
  dla artefaktu wydania.
- `trust.scanStatus` to obowiązujący stan zaufania wyprowadzony z danych
  skanerów i ręcznej moderacji wydania.
- `trust.moderationState` może mieć wartość null. Ma wartość `null`, gdy nie
  istnieje ręczna moderacja wydania.
- `trust.blockedFromDownload` jest sygnałem blokady instalacji. OpenClaw i inne
  klienty instalacyjne powinny blokować instalację, gdy ta wartość wynosi `true`,
  zamiast ponownie wyprowadzać reguły blokowania z pól skanera lub moderacji.
- `trust.reasons` to przeznaczona dla użytkownika i audytu lista wyjaśnień. Kody
  przyczyn są stabilnymi, zwartymi ciągami, takimi jak `manual:quarantined`,
  `scan:malicious` oraz `package:malicious`.
- `trust.pending` oznacza, że co najmniej jedno źródło danych o zaufaniu nadal
  oczekuje na ukończenie.
- `trust.stale` oznacza, że podsumowanie zaufania obliczono na podstawie
  nieaktualnych danych i przed podjęciem z dużą pewnością decyzji o zezwoleniu
  należy je odświeżyć.

Uwagi:

- Ten punkt końcowy dotyczy dokładnie określonej wersji. Klienty powinny wywołać
  go po rozpoznaniu wersji pakietu, którą zamierzają zainstalować, a nie tylko po
  odczytaniu metadanych najnowszego pakietu.
- Pakiety prywatne zwracają `404`, chyba że wywołujący ma uprawnienia do odczytu
  właściciela publikującego.
- Ten punkt końcowy jest celowo węższy niż punkty końcowe moderacji dla
  właścicieli i moderatorów. Udostępnia decyzję dotyczącą instalacji i publiczne
  wyjaśnienie, ale nie tożsamości zgłaszających, treść zgłoszeń, prywatne dowody
  ani wewnętrzne osie czasu przeglądu.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Zwraca jawne metadane mechanizmu rozpoznawania artefaktu dla wersji pakietu.

Uwagi:

- Starsze wersje pakietów zwracają artefakt `legacy-zip` oraz starszy adres
  `downloadUrl` archiwum ZIP.
- Wersje ClawPack zwracają artefakt `npm-pack`, pola integralności npm,
  `tarballUrl` oraz starszy adres URL zgodności ZIP.
- Jest to interfejs mechanizmu rozpoznawania OpenClaw, który pozwala uniknąć
  odgadywania formatu archiwum na podstawie wspólnego adresu URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Pobiera artefakt wersji przez jawną ścieżkę mechanizmu rozpoznawania.

Uwagi:

- Wersje ClawPack przesyłają strumieniowo dokładne przesłane bajty `.tgz`
  pakietu npm-pack.
- Starsze wersje ZIP przekierowują do
  `/api/v1/packages/{name}/download?version=`.
- Używa puli limitu szybkości pobierania.

### `GET /api/v1/packages/{name}/readiness`

Zwraca obliczoną gotowość do przyszłego wykorzystania przez OpenClaw.

Kontrole gotowości obejmują:

- stan oficjalnego kanału
- dostępność najnowszej wersji
- dostępność artefaktu npm-pack ClawPack
- skrót artefaktu
- repozytorium źródłowe i pochodzenie commita
- metadane zgodności z OpenClaw
- platformy docelowe
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

Punkt końcowy moderatora służący do wyświetlania wierszy migracji oficjalnych
pluginów OpenClaw.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `phase` (opcjonalny): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` lub
  `all` (domyślnie).
- `limit` (opcjonalny): liczba całkowita (1–100)
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

Punkt końcowy administratora służący do tworzenia lub aktualizowania wiersza
migracji oficjalnego pluginu.

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

- `bundledPluginId` jest normalizowany do małych liter i stanowi stabilny klucz
  operacji upsert.
- `packageName` jest normalizowany jako nazwa npm; pakiet może nie istnieć w
  przypadku planowanych migracji.
- Śledzi to wyłącznie gotowość migracji. Nie modyfikuje OpenClaw ani nie generuje
  pakietów ClawPack.

### `GET /api/v1/packages/moderation/queue`

Punkt końcowy moderatora lub administratora dla kolejek przeglądu wydań pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `status` (opcjonalny): `open` (domyślnie), `blocked`, `manual` lub `all`
- `limit` (opcjonalny): liczba całkowita (1–100)
- `cursor` (opcjonalny): kursor stronicowania

Znaczenie stanów:

- `open`: wydania podejrzane, złośliwe, oczekujące, poddane kwarantannie,
  unieważnione lub zgłoszone.
- `blocked`: wydania poddane kwarantannie, unieważnione lub złośliwe.
- `manual`: każde wydanie z ręcznym nadpisaniem moderacji.
- `all`: każde wydanie z ręcznym nadpisaniem, stanem skanowania innym niż czysty
  lub zgłoszeniem pakietu.

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

Zgłasza pakiet do przeglądu przez moderatora. Zgłoszenia dotyczą poziomu
pakietu i mogą opcjonalnie być powiązane z wersją. Trafiają do kolejki
moderacji, ale same nie powodują automatycznego ukrycia ani zablokowania
pobierania; moderatorzy powinni używać moderacji wydań, aby zatwierdzać,
poddawać kwarantannie lub unieważniać artefakty.

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

Punkt końcowy dla moderatorów/administratorów służący do przyjmowania zgłoszeń dotyczących pakietów.

Uwierzytelnianie:

- Wymaga tokenu API użytkownika będącego moderatorem lub administratorem.

Parametry zapytania:

- `status` (opcjonalny): `open` (domyślnie), `confirmed`, `dismissed` lub `all`
- `limit` (opcjonalny): liczba całkowita (1–100)
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

Punkt końcowy dla właścicieli/moderatorów zapewniający wgląd w moderację pakietu.

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

Punkt końcowy dla moderatorów/administratorów służący do rozstrzygania lub ponownego otwierania zgłoszeń dotyczących pakietów.

Żądanie:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

Pole `note` jest wymagane dla `confirmed` i `dismissed`; można je pominąć podczas
ponownego ustawiania `status` na `open`. Przekaż `finalAction: "quarantine"` lub
`finalAction: "revoke"` wraz z potwierdzonym zgłoszeniem, aby zastosować moderację wydania w ramach
tego samego audytowalnego procesu.

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

Punkt końcowy dla moderatorów/administratorów służący do weryfikacji wydania pakietu.

Żądanie:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Obsługiwane stany:

- `approved`: ręcznie zweryfikowane i dozwolone.
- `quarantined`: zablokowane do czasu dalszej weryfikacji.
- `revoked`: zablokowane po wcześniejszym uznaniu wydania za zaufane.

Trasy pobierania artefaktów zwracają `403` dla wydań poddanych kwarantannie i unieważnionych.
Każda zmiana powoduje zapisanie wpisu w dzienniku audytu.

### `GET /api/v1/packages/{name}/file`

Zwraca nieprzetworzoną zawartość tekstową pliku pakietu.

Parametry zapytania:

- `path` (wymagany)
- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Korzysta z puli limitu odczytów, a nie z puli pobierań.
- Pliki binarne powodują zwrócenie `415`.
- Limit rozmiaru pliku: 200 KB.
- Oczekujące skanowania VirusTotal nie blokują odczytów; złośliwe wydania mogą nadal być ukrywane w innych miejscach.
- Pakiety prywatne powodują zwrócenie `404`, chyba że wywołujący ma uprawnienia do odczytu wydawcy będącego właścicielem.

### `GET /api/v1/packages/{name}/download`

Pobiera starsze deterministyczne archiwum ZIP wydania pakietu.

Parametry zapytania:

- `version` (opcjonalny)
- `tag` (opcjonalny)

Uwagi:

- Domyślnie używa najnowszego wydania.
- Skills przekierowują do `GET /api/v1/download`.
- Archiwa Pluginów/pakietów są plikami ZIP z katalogiem głównym `package/`, dzięki czemu starsze klienty OpenClaw
  nadal działają.
- Ta trasa obsługuje wyłącznie format ZIP. Nie przesyła strumieniowo plików ClawPack `.tgz`.
- Odpowiedzi zawierają nagłówki `ETag`, `Digest`, `X-ClawHub-Artifact-Type` oraz
  `X-ClawHub-Artifact-Sha256` na potrzeby kontroli integralności przez mechanizm rozpoznawania.
- Metadane przeznaczone wyłącznie dla rejestru nie są wstrzykiwane do pobieranego archiwum.
- Oczekujące skanowania VirusTotal nie blokują pobierania; złośliwe wydania powodują zwrócenie `403`.
- Pakiety prywatne powodują zwrócenie `404`, chyba że wywołujący jest właścicielem.

### `GET /api/npm/{package}`

Zwraca zgodny z npm dokument packument dla wersji pakietów opartych na ClawPack.

Uwagi:

- Wyświetlane są wyłącznie wersje z przesłanymi archiwami tar ClawPack typu npm-pack.
- Starsze wersje dostępne wyłącznie jako ZIP są celowo pomijane.
- Pola `dist.tarball`, `dist.integrity` i `dist.shasum` są zgodne z npm,
  dzięki czemu użytkownicy mogą skierować npm do kopii lustrzanej.
- Dokumenty packument pakietów o określonym zakresie obsługują zarówno ścieżkę `/api/npm/@scope/name`, jak i
  zakodowaną ścieżkę żądania npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Przesyła strumieniowo dokładne bajty przesłanego archiwum tar ClawPack dla klientów kopii lustrzanej npm.

Uwagi:

- Korzysta z puli limitu pobierań.
- Nagłówki pobierania zawierają sumę SHA-256 ClawHub oraz metadane integralności/sumy kontrolnej npm.
- Nadal obowiązują mechanizmy moderacji i kontroli dostępu do pakietów prywatnych.

### `GET /api/v1/resolve`

Używany przez CLI do przypisania lokalnego odcisku do znanej wersji.

Parametry zapytania:

- `slug` (wymagany)
- `hash` (wymagany): 64-znakowy szesnastkowy skrót sha256 odcisku pakietu

Odpowiedź:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Pobiera plik ZIP hostowanej wersji Skills albo zwraca przekazanie do źródła GitHub dla
bieżącej Skills opartej na GitHub, której skan ma wynik `clean` lub `suspicious` i która nie ma
wersji hostowanej.

Parametry zapytania:

- `slug` (wymagany)
- `version` (opcjonalny): ciąg semver
- `tag` (opcjonalny): nazwa znacznika (np. `latest`)

Uwagi:

- Jeśli nie podano ani `version`, ani `tag`, używana jest najnowsza wersja.
- Wersje usunięte miękko powodują zwrócenie `410`.
- Przekazania Skills opartych na GitHub nie pośredniczą w przesyłaniu bajtów ani nie tworzą ich kopii lustrzanej. Odpowiedź JSON
  zawiera `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  oraz `archiveUrl`; stan skanowania/bieżący pełni funkcję warunku dostępu i nie jest dołączany jako metadane
  treści odpowiedzi oznaczającej powodzenie.
- Statystyki pobierania są zliczane jako unikatowe tożsamości na każdy dzień UTC (`userId`, gdy token API jest prawidłowy, w przeciwnym razie adres IP).

## Punkty końcowe uwierzytelniania (token Bearer)

Wszystkie punkty końcowe wymagają:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Sprawdza poprawność tokenu i zwraca identyfikator użytkownika.

### `POST /api/v1/skills`

Publikuje nową wersję.

- Preferowane: `multipart/form-data` z danymi JSON w `payload` oraz obiektami blob `files[]`.
- Akceptowane jest również ciało JSON z `files` (opartymi na storageId).
- Opcjonalne pole treści: `ownerHandle`. Jeśli jest obecne, API rozpoznaje tego
  wydawcę po stronie serwera i wymaga, aby wykonawca miał dostęp do wydawcy.
- Opcjonalne pole treści: `migrateOwner`. Gdy ma wartość `true` i podano `ownerHandle`,
  istniejąca Skills może zostać przeniesiona do tego właściciela, jeśli wykonawca jest administratorem/właścicielem zarówno
  bieżącego, jak i docelowego wydawcy. Bez tej jawnej zgody zmiany właściciela są
  odrzucane.

### `POST /api/v1/packages`

Publikuje wydanie typu code-plugin lub bundle-plugin.

- Wymaga uwierzytelniania tokenem Bearer.
- Wymaga `multipart/form-data`.
- Dozwolone pola formularza to `payload`, powtarzające się obiekty blob `files` albo jedno odwołanie do archiwum tar `clawpack`.
  `clawpack` może być obiektem blob `.tgz` lub identyfikatorem magazynu zwróconym przez
  proces uzyskiwania adresu URL przesyłania. Publikacje etapowane przy użyciu identyfikatora magazynu muszą również zawierać
  `clawpackUploadTicket` zwrócony wraz z tym adresem URL przesyłania.
- Użyj `files` albo `clawpack`, nigdy obu w tym samym żądaniu.
- Ciała JSON oraz metadane `payload.files` / `payload.artifact` dostarczone przez wywołującego
  są odrzucane.
- Bezpośrednie żądania publikacji multipart są ograniczone do 18 MB. Archiwa tar ClawPack mogą
  korzystać z procesu uzyskiwania adresu URL przesyłania do limitu 120 MB na archiwum tar.
- Opcjonalne pole treści: `ownerHandle`. Jeśli jest obecne, tylko administratorzy mogą publikować w imieniu tego właściciela.

Najważniejsze reguły walidacji:

- `family` musi mieć wartość `code-plugin` lub `bundle-plugin`.
- Pakiety Pluginów wymagają pliku `openclaw.plugin.json`. Przesyłane archiwa ClawPack `.tgz` muszą
  zawierać go pod ścieżką `package/openclaw.plugin.json`.
- Pluginy kodu wymagają pliku `package.json`, metadanych repozytorium źródłowego, metadanych zatwierdzenia
  źródła, metadanych schematu konfiguracji, `openclaw.compat.pluginApi` oraz
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` i `openclaw.environment` są opcjonalnymi metadanymi.
- Publikować w kanale `official` mogą wyłącznie wydawca organizacji `openclaw` oraz osobiści wydawcy
  bieżących członków organizacji `openclaw`.
- Publikacje w imieniu innego podmiotu również sprawdzają uprawnienia do kanału oficjalnego względem konta docelowego właściciela.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Miękkie usunięcie / przywrócenie Skills (właściciel, moderator lub administrator).

Opcjonalne ciało JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Jeśli pole `reason` jest obecne, zostaje zapisane jako notatka moderacyjna Skills i skopiowane do dziennika audytu.
Miękkie usunięcia zainicjowane przez właściciela rezerwują uproszczoną nazwę na 30 dni, po czym może ona zostać przejęta przez
innego wydawcę. Odpowiedź usunięcia zawiera `slugReservedUntil`, gdy ten termin wygaśnięcia ma zastosowanie.
Ukrycia wykonywane przez moderatora/administratora oraz usunięcia ze względów bezpieczeństwa nie wygasają w ten sposób.

Odpowiedź usunięcia:

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
W przypadku nowo utworzonej organizacji podaj `memberHandle`; administrator wykonujący operację nie zostanie dodany jako członek.
Domyślną wartością `memberRole` jest `owner`.

- Ciało: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Samodzielne tworzenie wydawcy organizacji przez uwierzytelnionego użytkownika. Tworzy nowego wydawcę organizacji i dodaje
wywołującego jako właściciela. Ten punkt końcowy nie migruje istniejących identyfikatorów użytkowników/osobistych
ani nie oznacza wydawcy jako zaufanego/oficjalnego.

- Ciało: `{ "handle": "opik", "displayName": "Opik" }`
- Odpowiedź: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Zwraca `409`, gdy identyfikator jest już używany przez wydawcę, użytkownika lub osobistego wydawcę.

### `POST /api/v1/users/reserve`

Tylko dla administratorów. Rezerwuje główne uproszczone nazwy i nazwy pakietów dla prawowitego właściciela bez publikowania
wydania. Nazwy pakietów stają się prywatnymi pakietami zastępczymi bez wierszy wydań, dzięki czemu ten sam
właściciel może później opublikować pod tą nazwą rzeczywiste wydanie typu code-plugin lub bundle-plugin.

- Ciało: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Odpowiedź: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Tylko dla administratorów. Odzyskuje osobistego wydawcę dla zweryfikowanego zastępczego podmiotu GitHub OAuth
bez edytowania wierszy kont Convex Auth. Żądanie musi określać oba niezmienne identyfikatory konta
dostawcy GitHub; zmienne identyfikatory są używane wyłącznie jako zabezpieczenie dla operatora.

Punkt końcowy domyślnie działa w trybie próbnym. Zastosowanie odzyskiwania wymaga ustawienia `dryRun: false` oraz
`confirmIdentityVerified: true` po niezależnym zweryfikowaniu przez personel ciągłości między oboma
podmiotami GitHub. Odzyskiwanie kończy się bez wprowadzania zmian, gdy bieżący osobisty
wydawca użytkownika docelowego ma Skills, pakiety lub źródła Skills z GitHub.
Odzyskiwanie migruje również starsze pola `ownerUserId` dla Skills odzyskanego wydawcy,
aliasów slugów Skills, pakietów, ostrzeżeń inspektora pakietów oraz pochodnych wierszy skrótów wyszukiwania, tak aby
ścieżki bezpośredniego właściciela były zgodne z nowymi uprawnieniami wydawcy. Aktywna rezerwacja
chronionej nazwy użytkownika dla odzyskiwanej nazwy jest również przypisywana użytkownikowi zastępczemu, aby późniejsza
synchronizacja profilu nie mogła przywrócić konkurencyjnych uprawnień poprzedniego użytkownika. Każda tabela główna jest ograniczona do
100 wierszy na transakcję zastosowania; większe operacje odzyskiwania muszą najpierw użyć wznawialnej migracji właściciela.
Źródła Skills z GitHub mają zakres wydawcy i są zgłaszane jako sprawdzone, a nie przepisywane.

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

- Oba punkty końcowe wymagają uwierzytelniania tokenem API i działają wyłącznie dla właściciela Skills.
- `rename` zachowuje poprzedni slug jako alias przekierowania.
- `merge` ukrywa wpis źródłowy i przekierowuje slug źródłowy do wpisu docelowego.

### Punkty końcowe przenoszenia własności

- `POST /api/v1/skills/{slug}/transfer`
  - Treść żądania: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Odpowiedź: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Odpowiedź (akceptacja/odrzucenie/anulowanie): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Struktura odpowiedzi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Zablokuj użytkownika i trwale usuń należące do niego Skills (tylko moderator/administrator).

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

Odblokuj użytkownika i przywróć kwalifikujące się Skills (tylko administrator).

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

Zmień zapisany powód istniejącej blokady bez odblokowywania użytkownika ani przywracania
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

Wyświetl listę użytkowników lub wyszukaj ich (tylko administrator).

Parametry zapytania:

- `q` (opcjonalny): zapytanie wyszukiwania
- `query` (opcjonalny): alias parametru `q`
- `limit` (opcjonalny): maksymalna liczba wyników (domyślnie 20, maksymalnie 200)

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

Dodaj/usuń gwiazdkę (wyróżnienie). Oba punkty końcowe są idempotentne.

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

Plan usunięcia znajduje się w pliku `DEPRECATIONS.md`.

`POST /api/cli/upload-url` zwraca `uploadUrl` oraz `uploadTicket`. Publikacje
pakietów, które przygotowują archiwum tar ClawPack, muszą przesłać wynikowy identyfikator magazynu jako
`clawpack`, a zwrócony bilet jako `clawpackUploadTicket`.

## Wykrywanie rejestru (`/.well-known/clawhub.json`)

CLI może wykryć ustawienia rejestru/uwierzytelniania na podstawie witryny:

- `/.well-known/clawhub.json` (JSON, preferowany)
- `/.well-known/clawdhub.json` (starszy)

Schemat:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

W przypadku samodzielnego hostowania udostępnij ten plik (lub jawnie ustaw `CLAWHUB_REGISTRY`; starsza zmienna: `CLAWDHUB_REGISTRY`).
