---
read_when:
    - Tworzenie klientów API
    - Dodawanie punktów końcowych lub schematów
summary: Omówienie i konwencje publicznego interfejsu REST API (v1).
x-i18n:
    generated_at: "2026-06-30T22:37:39Z"
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

## Ponowne użycie katalogu publicznego

Możesz zbudować zewnętrzny katalog, spis lub powierzchnię wyszukiwania na publicznych interfejsach API odczytu ClawHub. Publiczne metadane Skills i pliki Skills są publikowane zgodnie z zasadami licencji Skills ClawHub, natomiast samo API jest objęte limitami szybkości i powinno być używane odpowiedzialnie.

Wytyczne:

- Używaj publicznych endpointów odczytu, takich jak `GET /api/v1/skills`, `GET /api/v1/search` i `GET /api/v1/skills/{slug}` do list katalogowych.
- Buforuj odpowiedzi i respektuj `429`, `Retry-After` oraz nagłówki limitów szybkości zamiast agresywnego odpytywania.
- Podczas wyświetlania list linkuj do kanonicznego adresu URL Skills w ClawHub, aby użytkownicy mogli sprawdzić źródłowy rekord rejestru.
- Używaj kanonicznych adresów URL stron w formacie `https://clawhub.ai/<owner>/skills/<slug>`.
- Nie sugeruj, że ClawHub promuje, weryfikuje lub obsługuje zewnętrzną witrynę.
- Nie klonuj ukrytych, prywatnych ani zablokowanych przez moderację treści przez omijanie publicznych filtrów API lub granic uwierzytelniania.

## Uwierzytelnianie

- Odczyt publiczny: token nie jest wymagany.
- Zapis + konto: `Authorization: Bearer clh_...`.

## Limity szybkości

Egzekwowanie z uwzględnieniem uwierzytelnienia:

- Żądania anonimowe: według adresu IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): według koszyka użytkownika.
- Brakujący/nieprawidłowy token przechodzi na egzekwowanie według adresu IP.

- Odczyt: 3000/min na IP, 12000/min na klucz
- Zapis: 300/min na IP, 3000/min na klucz
- Pobieranie: 1200/min na IP, 6000/min na klucz

Nagłówki: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` i `Retry-After` są dołączane przy `429`.

Semantyka:

- `X-RateLimit-Reset`: sekundy epoki Unix (bezwzględny czas resetu)
- `RateLimit-Reset`: liczba sekund opóźnienia do resetu
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały budżet, gdy
  występuje; podzielone na shardy udane żądania pomijają go zamiast zwracać przybliżoną
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

Obsługa klienta:

- Preferuj `Retry-After`, gdy jest obecny.
- W przeciwnym razie użyj `RateLimit-Reset` albo wylicz opóźnienie z `X-RateLimit-Reset`.
- Dodaj jitter do ponowień.

## Błędy

- Błędy v1 są zwykłym tekstem (`text/plain; charset=utf-8`), w tym `400`,
  `401`, `403`, `404`, `429` oraz odpowiedzi z zablokowanego pobierania.
- Nieznane parametry zapytania są ignorowane dla zgodności.
- Znane parametry zapytania z nieprawidłowymi wartościami zwracają `400`.

## Endpointy

Odczyt publiczny:

- `GET /api/v1/search?q=...`
  - Opcjonalne filtry: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Starszy alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` mapują się na `downloads`, `trending`
  - Nieprawidłowe wartości `sort` zwracają `400`
  - `cursor` dotyczy sortowań innych niż `trending`
  - Opcjonalny filtr: `nonSuspiciousOnly=true`
  - Starszy alias: `nonSuspicious=true`
  - Z `nonSuspiciousOnly=true` strony oparte na kursorze mogą zawierać mniej niż `limit` elementów; użyj `nextCursor`, aby kontynuować.
  - `recommended` używa sygnałów zaangażowania i świeżości.
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
  - Hostowane Skills są eksportowane jako zapisane pliki.
  - Bieżące Skills oparte na GitHub z wynikiem skanowania `clean` lub `suspicious` są eksportowane
    jako deskryptory przekazania `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `recommended`, `downloads`, starszy alias `installs`
  - Nieprawidłowe wartości `sort` zwracają `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (domyślnie), `downloads`, `updated`, starszy alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Wymagane uwierzytelnienie:

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

- `POST /api/v1/users/reserve` rezerwuje główne slugi i prywatne zastępcze pakiety bez wydań dla uchwytu właściciela.

## Starsze

Starsze `/api/*` i `/api/cli/*` są nadal dostępne. Zobacz `DEPRECATIONS.md`.
