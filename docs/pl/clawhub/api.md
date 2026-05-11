---
read_when:
    - Tworzenie klientów API
    - Dodawanie punktów końcowych lub schematów
summary: Przegląd i konwencje publicznego REST API (v1).
x-i18n:
    generated_at: "2026-05-11T20:22:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Baza: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Ponowne użycie katalogu publicznego

Możesz zbudować katalog, spis lub powierzchnię wyszukiwania strony trzeciej na publicznych interfejsach API odczytu ClawHub. Publiczne metadane Skills i pliki Skills są publikowane zgodnie z zasadami licencji Skills ClawHub, natomiast sam interfejs API ma limity szybkości i powinien być używany odpowiedzialnie.

Wytyczne:

- Używaj publicznych punktów końcowych odczytu, takich jak `GET /api/v1/skills`, `GET /api/v1/search` i `GET /api/v1/skills/{slug}` do list katalogowych.
- Buforuj odpowiedzi i respektuj `429`, `Retry-After` oraz nagłówki limitów szybkości zamiast agresywnego odpytywania.
- Przy wyświetlaniu list linkuj z powrotem do kanonicznego adresu URL Skills w ClawHub, aby użytkownicy mogli sprawdzić źródłowy rekord rejestru.
- Używaj kanonicznych adresów URL stron w postaci `https://clawhub.ai/<owner>/<slug>`.
- Nie sugeruj, że ClawHub popiera, weryfikuje lub obsługuje witrynę strony trzeciej.
- Nie twórz kopii ukrytych, prywatnych ani zablokowanych moderacyjnie treści przez omijanie publicznych filtrów API lub granic uwierzytelniania.

## Uwierzytelnianie

- Odczyt publiczny: token nie jest wymagany.
- Zapis + konto: `Authorization: Bearer clh_...`.

## Limity szybkości

Egzekwowanie uwzględniające uwierzytelnianie:

- Żądania anonimowe: według adresu IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): według zasobnika użytkownika.
- Brakujący/nieprawidłowy token powoduje powrót do egzekwowania według IP.

- Odczyt: 600/min na IP, 2400/min na klucz
- Zapis: 45/min na IP, 180/min na klucz

Nagłówki: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (przy 429).

Semantyka:

- `X-RateLimit-Reset`: sekundy epoki Unix (bezwzględny czas resetu)
- `RateLimit-Reset`: sekundy opóźnienia do resetu
- `Retry-After`: sekundy opóźnienia oczekiwania przy `429`

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
- W przeciwnym razie użyj `RateLimit-Reset` albo wyprowadź opóźnienie z `X-RateLimit-Reset`.
- Dodaj losowe odchylenie do ponownych prób.

## Punkty końcowe

Odczyt publiczny:

- `GET /api/v1/search?q=...`
  - Filtry opcjonalne: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Starszy alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` ma zastosowanie do sortowań innych niż `trending`
  - Filtr opcjonalny: `nonSuspiciousOnly=true`
  - Starszy alias: `nonSuspicious=true`
  - Z `nonSuspiciousOnly=true` strony oparte na kursorze mogą zawierać mniej niż `limit` elementów; użyj `nextCursor`, aby kontynuować.
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

- `POST /api/v1/skills` (publikowanie, preferowany multipart)
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

- `POST /api/v1/users/reserve` rezerwuje główne slugi i prywatne zastępcze pakiety bez wydań dla uchwytu właściciela.

## Starsze

Starsze `/api/*` i `/api/cli/*` są nadal dostępne. Zobacz `DEPRECATIONS.md`.
