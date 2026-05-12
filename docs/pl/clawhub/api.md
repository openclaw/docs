---
read_when:
    - Tworzenie klientów API
    - Dodawanie punktów końcowych lub schematów
summary: Przegląd i konwencje publicznego interfejsu REST API (v1).
x-i18n:
    generated_at: "2026-05-12T04:09:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Baza: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Ponowne wykorzystanie katalogu publicznego

Możesz zbudować katalog zewnętrzny, spis lub powierzchnię wyszukiwania na publicznych API odczytu ClawHub. Publiczne metadane skill i pliki skill są publikowane zgodnie z zasadami licencji skill ClawHub, natomiast samo API ma limity szybkości i powinno być używane odpowiedzialnie.

Wytyczne:

- Używaj publicznych endpointów odczytu, takich jak `GET /api/v1/skills`, `GET /api/v1/search` i `GET /api/v1/skills/{slug}` do list katalogowych.
- Buforuj odpowiedzi i respektuj `429`, `Retry-After` oraz nagłówki limitów szybkości zamiast agresywnego odpytywania.
- Przy wyświetlaniu list linkuj z powrotem do kanonicznego URL skill w ClawHub, aby użytkownicy mogli sprawdzić źródłowy rekord rejestru.
- Używaj kanonicznych URL stron w formie `https://clawhub.ai/<owner>/<slug>`.
- Nie sugeruj, że ClawHub popiera, weryfikuje lub obsługuje witrynę zewnętrzną.
- Nie kopiuj ukrytej, prywatnej ani zablokowanej przez moderację treści przez obchodzenie publicznych filtrów API lub granic uwierzytelniania.

## Uwierzytelnianie

- Odczyt publiczny: token nie jest wymagany.
- Zapis + konto: `Authorization: Bearer clh_...`.

## Limity szybkości

Egzekwowanie uwzględniające uwierzytelnianie:

- Żądania anonimowe: według IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): według koszyka użytkownika.
- Brakujący/nieprawidłowy token wraca do egzekwowania według IP.

- Odczyt: 600/min na IP, 2400/min na klucz
- Zapis: 45/min na IP, 180/min na klucz

Nagłówki: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (przy 429).

Semantyka:

- `X-RateLimit-Reset`: sekundy epoki Unix (bezwzględny czas resetu)
- `RateLimit-Reset`: liczba sekund opóźnienia do resetu
- `Retry-After`: liczba sekund oczekiwania przy `429`

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
- W przeciwnym razie użyj `RateLimit-Reset` lub wylicz opóźnienie z `X-RateLimit-Reset`.
- Dodaj losowy jitter do ponowień.

## Endpointy

Odczyt publiczny:

- `GET /api/v1/search?q=...`
  - Filtry opcjonalne: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias starszej wersji: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` dotyczy sortowań innych niż `trending`
  - Filtr opcjonalny: `nonSuspiciousOnly=true`
  - Alias starszej wersji: `nonSuspicious=true`
  - Przy `nonSuspiciousOnly=true` strony oparte na kursorze mogą zawierać mniej elementów niż `limit`; użyj `nextCursor`, aby kontynuować.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Tylko administrator:

- `POST /api/v1/users/reserve` rezerwuje główne slugi i prywatne symbole zastępcze pakietów bez wydań dla uchwytu właściciela.

## Starsza wersja

Starsze `/api/*` i `/api/cli/*` są nadal dostępne. Zobacz `DEPRECATIONS.md`.
