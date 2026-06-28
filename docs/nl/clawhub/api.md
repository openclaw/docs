---
read_when:
    - API-clients bouwen
    - Eindpunten of schema's toevoegen
summary: Overzicht en conventies van de openbare REST-API (v1).
x-i18n:
    generated_at: "2026-06-28T00:10:29Z"
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

Je kunt een catalogus, directory of zoekoppervlak van derden bouwen boven op de openbare lees-API's van ClawHub. Openbare skillmetadata en skillbestanden worden gepubliceerd onder de skilllicentieregels van ClawHub, terwijl de API zelf rate-limited is en verantwoord moet worden gebruikt.

Richtlijnen:

- Gebruik openbare leesendpoints zoals `GET /api/v1/skills`, `GET /api/v1/search` en `GET /api/v1/skills/{slug}` voor catalogusvermeldingen.
- Cache responses en respecteer `429`, `Retry-After` en rate-limit-headers in plaats van agressief te pollen.
- Link terug naar de canonieke ClawHub-skill-URL bij het weergeven van vermeldingen, zodat gebruikers de bronregistratie kunnen inspecteren.
- Gebruik canonieke pagina-URL's in de vorm `https://clawhub.ai/<owner>/skills/<slug>`.
- Impliceer niet dat ClawHub de site van derden onderschrijft, verifieert of beheert.
- Mirror geen verborgen, private of door moderatie geblokkeerde content door openbare API-filters of auth-grenzen te omzeilen.

## Auth

- Openbaar lezen: geen token vereist.
- Schrijven + account: `Authorization: Bearer clh_...`.

## Rate limits

Auth-bewuste handhaving:

- Anonieme requests: per IP.
- Geauthenticeerde requests (geldig Bearer-token): per gebruikersbucket.
- Ontbrekend/ongeldig token valt terug op IP-handhaving.

- Lezen: 3000/min per IP, 12000/min per key
- Schrijven: 300/min per IP, 3000/min per key
- Downloaden: 1200/min per IP, 6000/min per key

Headers: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` en `Retry-After` worden opgenomen bij `429`.

Semantiek:

- `X-RateLimit-Reset`: Unix-epochseconden (absolute resettijd)
- `RateLimit-Reset`: vertraging in seconden tot reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exact resterend budget wanneer
  aanwezig; gesharde succesvolle requests laten dit weg in plaats van een benaderende
  globale waarde terug te geven
- `Retry-After`: vertraging in seconden om te wachten bij `429`

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
  `401`, `403`, `404`, `429` en geblokkeerde-downloadresponses.
- Onbekende queryparameters worden genegeerd voor compatibiliteit.
- Bekende queryparameters met ongeldige waarden geven `400` terug.

## Endpoints

Openbaar lezen:

- `GET /api/v1/search?q=...`
  - Optionele filters: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy-alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (standaard), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), legacy-installatiealiassen `installsCurrent`/`installs`/`installsAllTime` mappen naar `downloads`, `trending`
  - Ongeldige `sort`-waarden geven `400` terug
  - `cursor` is van toepassing op niet-`trending`-sorteringen
  - Optioneel filter: `nonSuspiciousOnly=true`
  - Legacy-alias: `nonSuspicious=true`
  - Met `nonSuspiciousOnly=true` kunnen cursorgebaseerde pagina's minder dan `limit` items bevatten; gebruik `nextCursor` om door te gaan.
  - `recommended` gebruikt engagement- en recentheidssignalen.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Gehoste skills geven deterministische ZIP-bytes terug.
  - Huidige door GitHub ondersteunde skills met een `clean`- of `suspicious`-scan geven een
    JSON-`public-github`-handoffdescriptor terug in plaats van ClawHub-bytes.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Gehoste skills worden geëxporteerd als opgeslagen bestanden.
  - Huidige door GitHub ondersteunde skills met een `clean`- of `suspicious`-scan worden geëxporteerd
    als `public-github`-handoffdescriptors.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (standaard), `recommended`, `downloads`, legacy-alias `installs`
  - Ongeldige `sort`-waarden geven `400` terug
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

- `POST /api/v1/users/reserve` reserveert root-slugs en private no-release package-placeholders voor een owner-handle.

## Legacy

Legacy `/api/*` en `/api/cli/*` nog steeds beschikbaar. Zie `DEPRECATIONS.md`.
