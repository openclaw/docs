---
read_when:
    - Tworzenie klientów API
    - Dodawanie punktów końcowych lub schematów
summary: Omówienie i konwencje publicznego interfejsu API REST (v1).
x-i18n:
    generated_at: "2026-07-16T18:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Baza: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Ponowne wykorzystanie publicznego katalogu

Na podstawie publicznych interfejsów API odczytu ClawHub można utworzyć katalog, spis lub mechanizm wyszukiwania innej firmy. Publiczne metadane i pliki Skills są publikowane zgodnie z zasadami licencjonowania Skills w ClawHub, natomiast samo API podlega ograniczeniom szybkości i należy z niego korzystać odpowiedzialnie.

Wytyczne:

- Do wyświetlania katalogu należy używać publicznych punktów końcowych odczytu, takich jak `GET /api/v1/skills`, `GET /api/v1/search` i `GET /api/v1/skills/{slug}`.
- Należy buforować odpowiedzi oraz przestrzegać `429`, `Retry-After` i nagłówków ograniczeń szybkości zamiast intensywnie odpytywać API.
- Podczas wyświetlania wpisów należy zamieszczać odnośnik do kanonicznego adresu URL Skills w ClawHub, aby użytkownicy mogli sprawdzić źródłowy rekord rejestru.
- Należy używać kanonicznych adresów URL stron w postaci `https://clawhub.ai/<owner>/skills/<slug>`.
- Nie należy sugerować, że ClawHub rekomenduje, weryfikuje lub prowadzi witrynę innej firmy.
- Nie należy kopiować ukrytych, prywatnych ani zablokowanych przez moderację treści poprzez omijanie filtrów publicznego API lub granic uwierzytelniania.

## Uwierzytelnianie

- Odczyt publiczny: token nie jest wymagany.
- Zapis i konto: `Authorization: Bearer clh_...`.

## Ograniczenia szybkości

Egzekwowanie z uwzględnieniem uwierzytelniania:

- Żądania anonimowe: według adresu IP.
- Żądania uwierzytelnione (prawidłowy token Bearer): według puli użytkownika.
- Brakujący lub nieprawidłowy token powoduje zastosowanie ograniczeń według adresu IP.

- Odczyt: 3000/min na adres IP, 12000/min na klucz
- Zapis: 300/min na adres IP, 3000/min na klucz
- Pobieranie: 1200/min na adres IP, 6000/min na klucz

Nagłówki: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` i `Retry-After` są dołączane do `429`.

Semantyka:

- `X-RateLimit-Reset`: sekundy epoki Unix (bezwzględny czas resetowania)
- `RateLimit-Reset`: liczba sekund opóźnienia do resetowania
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: dokładny pozostały limit, jeśli
  jest dostępny; pomyślne żądania podzielone na fragmenty pomijają go zamiast zwracać przybliżoną
  wartość globalną
- `Retry-After`: liczba sekund oczekiwania po otrzymaniu `429`

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

- Jeśli `Retry-After` jest dostępny, należy go preferować.
- W przeciwnym razie należy użyć `RateLimit-Reset` lub obliczyć opóźnienie na podstawie `X-RateLimit-Reset`.
- Należy dodać losowe odchylenie do ponawianych prób.

## Błędy

- Błędy v1 mają postać zwykłego tekstu (`text/plain; charset=utf-8`), w tym `400`,
  `401`, `403`, `404`, `429` oraz odpowiedzi dotyczące zablokowanego pobierania.
- Nieznane parametry zapytania są ignorowane w celu zachowania zgodności.
- Znane parametry zapytania z nieprawidłowymi wartościami zwracają `400`.

## Punkty końcowe

Odczyt publiczny:

- `GET /api/v1/search?q=...`
  - Opcjonalne filtry: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Starszy alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (domyślnie), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), starsze aliasy instalacji `installsCurrent`/`installs`/`installsAllTime` są mapowane na `downloads`, `trending`
  - Nieprawidłowe wartości `sort` zwracają `400`
  - `cursor` ma zastosowanie do sortowań innych niż `trending`
  - Opcjonalny filtr: `nonSuspiciousOnly=true`
  - Starszy alias: `nonSuspicious=true`
  - W przypadku `nonSuspiciousOnly=true` strony oparte na kursorze mogą zawierać mniej niż `limit` elementów; aby kontynuować, należy użyć `nextCursor`.
  - `recommended` wykorzystuje sygnały zaangażowania i aktualności.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Hostowane Skills zwracają deterministyczne bajty ZIP.
  - Bieżące Skills oparte na GitHub ze skanem `clean` lub `suspicious` zwracają
    deskryptor przekazania JSON `public-github` zamiast bajtów ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Hostowane Skills są eksportowane jako zapisane pliki.
  - Bieżące Skills oparte na GitHub ze skanem `clean` lub `suspicious` są eksportowane
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

Wymagane uwierzytelnianie:

- `POST /api/v1/skills` (publikowanie, preferowany format multipart)
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

Tylko dla administratorów:

- `POST /api/v1/users/reserve` rezerwuje główne identyfikatory slug i prywatne symbole zastępcze pakietów bez wydania dla identyfikatora właściciela.

## Starsza wersja

Starsze `/api/*` i `/api/cli/*` są nadal dostępne. Zobacz `DEPRECATIONS.md`.
