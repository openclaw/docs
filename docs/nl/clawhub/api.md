---
read_when:
    - API-clients bouwen
    - Eindpunten of schema's toevoegen
summary: Overzicht en conventies van de openbare REST-API (v1).
x-i18n:
    generated_at: "2026-06-27T17:14:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Hergebruik van openbare catalogus

Je kunt een catalogus, directory of zoekoppervlak van derden bouwen boven op de openbare lees-API's van ClawHub. Openbare Skills-metadata en Skills-bestanden worden gepubliceerd onder de licentieregels voor Skills van ClawHub, terwijl de API zelf rate-limited is en verantwoord moet worden gebruikt.

Richtlijnen:

- Gebruik openbare leesendpoints zoals `GET /api/v1/skills`, `GET /api/v1/search` en `GET /api/v1/skills/{slug}` voor catalogusvermeldingen.
- Cache reacties en respecteer `429`, `Retry-After` en rate-limit-headers in plaats van agressief te pollen.
- Link terug naar de canonieke ClawHub-Skills-URL bij het weergeven van vermeldingen, zodat gebruikers het bronregisterrecord kunnen inspecteren.
- Gebruik canonieke pagina-URL's in de vorm `https://clawhub.ai/<owner>/skills/<slug>`.
- Impliceer niet dat ClawHub de site van derden goedkeurt, verifieert of exploiteert.
- Mirror geen verborgen, privé- of door moderatie geblokkeerde content door openbare API-filters of auth-grenzen te omzeilen.

## Auth

- Openbaar lezen: geen token vereist.
- Schrijven + account: `Authorization: Bearer clh_...`.

## Rate limits

Auth-bewuste handhaving:

- Anonieme requests: per IP.
- Geauthenticeerde requests (geldig Bearer-token): per gebruikersbucket.
- Ontbrekend/ongeldig token valt terug op IP-handhaving.

- Lezen: 3000/min per IP, 12000/min per sleutel
- Schrijven: 300/min per IP, 3000/min per sleutel
- Download: 1200/min per IP, 6000/min per sleutel

Headers: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` en `Retry-After` worden opgenomen bij `429`.

Semantiek:

- `X-RateLimit-Reset`: Unix epoch-seconden (absolute resettijd)
- `RateLimit-Reset`: vertragingsseconden tot reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exact resterend budget wanneer
  aanwezig; gesharde succesvolle requests laten dit weg in plaats van een geschatte
  globale waarde terug te geven
- `Retry-After`: vertragingsseconden om te wachten bij `429`

Voorbeeld `429`:

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

Clientafhandeling:

- Geef de voorkeur aan `Retry-After` wanneer aanwezig.
- Gebruik anders `RateLimit-Reset` of leid de vertraging af uit `X-RateLimit-Reset`.
- Voeg jitter toe aan retries.

## Fouten

- v1-fouten zijn platte tekst (`text/plain; charset=utf-8`), inclusief `400`,
  `401`, `403`, `404`, `429` en geblokkeerde downloadreacties.
- Onbekende queryparameters worden genegeerd voor compatibiliteit.
- Bekende queryparameters met ongeldige waarden retourneren `400`.

## Endpoints

Openbaar lezen:

- `GET /api/v1/search?q=...`
  - Optionele filters: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy-alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (standaard), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), legacy-installatiealiassen `installsCurrent`/`installs`/`installsAllTime` verwijzen naar `downloads`, `trending`
  - Ongeldige `sort`-waarden retourneren `400`
  - `cursor` is van toepassing op niet-`trending`-sorteringen
  - Optioneel filter: `nonSuspiciousOnly=true`
  - Legacy-alias: `nonSuspicious=true`
  - Met `nonSuspiciousOnly=true` kunnen cursorgebaseerde pagina's minder dan `limit` items bevatten; gebruik `nextCursor` om door te gaan.
  - `recommended` gebruikt signalen voor betrokkenheid en recentheid.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Gehoste Skills retourneren deterministische ZIP-bytes.
  - Huidige Skills met GitHub-backend met een `clean`- of `suspicious`-scan retourneren een
    JSON-`public-github`-handoffdescriptor in plaats van ClawHub-bytes.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Gehoste Skills worden geëxporteerd als opgeslagen bestanden.
  - Huidige Skills met GitHub-backend met een `clean`- of `suspicious`-scan worden geëxporteerd
    als `public-github`-handoffdescriptors.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (standaard), `recommended`, `downloads`, legacy-alias `installs`
  - Ongeldige `sort`-waarden retourneren `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (standaard), `downloads`, `updated`, legacy-alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth vereist:

- `POST /api/v1/skills` (publiceren, multipart aanbevolen)
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

Alleen admin:

- `POST /api/v1/users/reserve` reserveert root-slugs en privépakketplaatshouders zonder release voor een owner-handle.

## Legacy

Legacy `/api/*` en `/api/cli/*` nog steeds beschikbaar. Zie `DEPRECATIONS.md`.
