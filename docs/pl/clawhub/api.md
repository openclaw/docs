---
read_when:
    - Tworzenie klientów API
    - Dodawanie punktów końcowych lub schematów
summary: Omówienie publicznego REST API (v1) i konwencje.
x-i18n:
    generated_at: "2026-07-04T04:09:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Baza: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Ponowne użycie publicznego katalogu

Możesz zbudować zewnętrzny katalog, spis lub powierzchnię wyszukiwania na bazie publicznych API odczytu ClawHub. Publiczne metadane Skills i pliki Skills są publikowane zgodnie z zasadami licencji Skills w ClawHub, natomiast samo API ma limity szybkości i powinno być używane odpowiedzialnie.

Wytyczne:

- Używaj publicznych endpointów odczytu, takich jak `GET /api/v1/skills`, `GET /api/v1/search` i `GET /api/v1/skills/{slug}`, do list katalogowych.
- Buforuj odpowiedzi i respektuj `429`, `Retry-After` oraz nagłówki limitów szybkości zamiast agresywnego odpytywania.
- Podczas wyświetlania list linkuj z powrotem do kanonicznego adresu URL Skills w ClawHub, aby użytkownicy mogli sprawdzić źródłowy wpis rejestru.
- Używaj kanonicznych adresów URL stron w formie `https://clawhub.ai/<owner>/skills/<slug>`.
- Nie sugeruj, że ClawHub popiera, weryfikuje lub obsługuje zewnętrzną witrynę.
- Nie twórz kopii ukrytych, prywatnych ani zablokowanych moderacyjnie treści przez omijanie filtrów publicznego API lub granic uwierzytelniania.

## Uwierzytelnianie

- Publiczny odczyt: token nie jest wymagany.
- Zapis + konto: `Authorization: Bearer clh_...`.

## Limity szybkości

Egzekwowanie z uwzględnieniem uwierzytelniania:

- Żądania anonimowe: według adresu IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): według koszyka użytkownika.
- Brakujący/nieprawidłowy token powoduje przejście na egzekwowanie według adresu IP.

- Odczyt: 3000/min na adres IP, 12000/min na klucz
- Zapis: 300/min na adres IP, 3000/min na klucz
- Pobieranie: 1200/min na adres IP, 6000/min na klucz

Nagłówki: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` i `Retry-After` są dołączane przy `429`.

Semantyka:

- `X-RateLimit-Reset`: sekundy epoki Unix (bezwzględny czas resetu)
- `RateLimit-Reset`: liczba sekund opóźnienia do resetu
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały budżet, gdy
  jest obecny; shardowane udane żądania pomijają go zamiast zwracać przybliżoną
  wartość globalną
- `Retry-After`: liczba sekund opóźnienia oczekiwania przy `429`

Przykład `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Obsługa po stronie klienta:

- Preferuj `Retry-After`, gdy jest obecny.
- W przeciwnym razie użyj `RateLimit-Reset` albo wylicz opóźnienie z `X-RateLimit-Reset`.
- Dodaj jitter do ponownych prób.

## Błędy

- Błędy v1 są zwykłym tekstem (`text/plain; charset=utf-8`), w tym `400`,
  `401`, `403`, `404`, `429` oraz odpowiedzi zablokowanego pobierania.
- Nieznane parametry zapytania są ignorowane ze względu na zgodność.
- Znane parametry zapytania z nieprawidłowymi wartościami zwracają `400`.

## Endpointy

Publiczny odczyt:

- `GET /api/v1/search?q=...`
  - Opcjonalne filtry: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias legacy: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), aliasy instalacji legacy `installsCurrent`/`installs`/`installsAllTime` mapują się na `downloads`, `trending`
  - Nieprawidłowe wartości `sort` zwracają `400`
  - `cursor` dotyczy sortowań innych niż `trending`
  - Opcjonalny filtr: `nonSuspiciousOnly=true`
  - Alias legacy: `nonSuspicious=true`
  - Przy `nonSuspiciousOnly=true` strony oparte na kursorze mogą zawierać mniej elementów niż `limit`; użyj `nextCursor`, aby kontynuować.
  - `recommended` wykorzystuje sygnały zaangażowania i świeżości.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Hostowane Skills zwracają deterministyczne bajty ZIP.
  - Bieżące Skills oparte na GitHub z wynikiem skanowania `clean` lub `suspicious` zwracają
    deskryptor przekazania JSON `public-github` zamiast bajtów ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Hostowane Skills są eksportowane jako przechowywane pliki.
  - Bieżące Skills oparte na GitHub z wynikiem skanowania `clean` lub `suspicious` są eksportowane
    jako deskryptory przekazania `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `recommended`, `downloads`, alias legacy `installs`
  - Nieprawidłowe wartości `sort` zwracają `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (domyślnie), `downloads`, `updated`, alias legacy `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Wymagane uwierzytelnianie:

- `POST /api/v1/skills` (publikacja, preferowany multipart)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Tylko administrator:

- `POST /api/v1/users/reserve` rezerwuje główne slugi i prywatne symbole zastępcze pakietów bez wydania dla uchwytu właściciela.

## Legacy

Legacy `/api/*` i `/api/cli/*` są nadal dostępne. Zobacz `DEPRECATIONS.md`.
