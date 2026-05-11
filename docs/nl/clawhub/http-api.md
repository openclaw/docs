---
read_when:
    - Eindpunten toevoegen/wijzigen
    - CLI ↔ registerverzoeken debuggen
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-05-11T20:24:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden vallen onder `/api/v1/...`.
Legacy `/api/...` en `/api/cli/...` blijven bestaan voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van openbare catalogus

Externe directory's mogen de openbare read-endpoints gebruiken om ClawHub Skills te tonen of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/<slug>`) en vermijd de indruk dat ClawHub de externe site onderschrijft. Probeer geen verborgen, privé- of door moderatie geblokkeerde inhoud buiten het openbare API-oppervlak te spiegelen.

Web-slug-snelkoppelingen lossen op over registry-families heen, maar API-clients moeten de canonieke URL's gebruiken die door read-endpoints worden teruggegeven in plaats van routeprioriteit te reconstrueren.

## Rate limits

Handhavingsmodel:

- Anonieme requests: gehandhaafd per IP.
- Geauthenticeerde requests (geldige Bearer-token): gehandhaafd per gebruikersbucket.
- Als de token ontbreekt of ongeldig is, valt het gedrag terug op IP-handhaving.
- Geauthenticeerde write-endpoints mogen geen kale `Unauthorized` teruggeven wanneer de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en verwijderde/gebande/uitgeschakelde accounts moeten elk bruikbare tekst krijgen, zodat CLI-clients gebruikers kunnen vertellen wat hen blokkeerde.

- Read: 600/min per IP, 2400/min per sleutel
- Write: 45/min per IP, 180/min per sleutel
- Download: 30/min per IP, 180/min per sleutel (`/api/v1/download`)

Headers:

- Legacy-compatibiliteit: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bij `429`: `Retry-After`

Headersemantiek:

- `X-RateLimit-Reset`: absolute Unix-epochtijd in seconden
- `RateLimit-Reset`: seconden tot reset (vertraging)
- `Retry-After`: seconden wachten vóór opnieuw proberen (vertraging) bij `429`

Voorbeeld van een `429`-response:

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

Clientrichtlijnen:

- Als `Retry-After` bestaat, wacht dan dat aantal seconden vóór opnieuw proberen.
- Gebruik jittered backoff om gesynchroniseerde retries te voorkomen.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt standaard `cf-connecting-ip` (Cloudflare) voor client-IP.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als er geen vertrouwd client-IP beschikbaar is, gebruiken anonieme downloadrequests een endpoint-gebonden fallbackbucket in plaats van één globale `ip:unknown`-bucket. Anonieme read/write-requests gebruiken nog steeds de gedeelde unknown-bucket, zodat routering met ontbrekend IP zichtbaar en conservatief blijft.

## Openbare endpoints (geen authenticatie)

### `GET /api/v1/search`

Queryparameters:

- `q` (verplicht): querystring
- `limit` (optioneel): integer
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte Skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Response:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

Opmerkingen:

- Resultaten worden teruggegeven in relevantievolgorde (embeddingovereenkomst + exacte slug-/naam-tokenboosts + populariteitsprior uit downloads).
- Relevantie is sterker dan populariteit. Een precieze slug- of displaynaam-tokenmatch kan hoger scoren dan een lossere match met veel meer downloads.
- ASCII-tekst wordt getokenized op woord- en interpunctiegrenzen. Bijvoorbeeld: `personal-map` bevat een zelfstandige `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale match dan `amap-jsapi-skill`.
- Downloads worden gebruikt als een kleine log-geschaalde prior en tie-breaker, niet als het primaire rankingsignaal. Skills met veel downloads kunnen lager scoren wanneer de querytekst een zwakkere match is.
- Verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van callerfilters en de huidige moderatiestatus.

Richtlijnen voor vindbaarheid van publishers:

- Zet de termen waarop gebruikers letterlijk zullen zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandige slug-token wanneer die ook een stabiele identiteit is die je wilt behouden.
- Hernoem een slug niet alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirect-aliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemingsaliassen behouden resolutie voor oude URL's en installs die via de registry oplossen, maar zoekranking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect <slug>` terwijl je bent ingelogd, voordat je rankinggerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): integer (1–200)
- `cursor` (optioneel): pagineringscursor voor elke niet-`trending` sortering
- `sort` (optioneel): `updated` (standaard), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Opmerkingen:

- `trending` rangschikt op installs in de afgelopen 7 dagen (op basis van telemetry).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina teruggeven, omdat verdachte Skills na het ophalen van de pagina worden gefilterd.
- Gebruik `nextCursor` om paginering voort te zetten wanneer aanwezig. Een korte pagina betekent op zichzelf niet dat het einde van de resultaten is bereikt.

Response:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
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

Response:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
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

Opmerkingen:

- Oude slugs die zijn gemaakt door owner-rename-/merge-flows lossen op naar de canonieke Skill.
- `metadata.os`: OS-beperkingen die in Skill-frontmatter zijn gedeclareerd (bijv. `["macos"]`, `["linux"]`). `null` als niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` als niet gedeclareerd.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is geflagd of de owner deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Geeft gestructureerde moderatiestatus terug.

Response:

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

Opmerkingen:

- Owners en moderators hebben toegang tot moderatiedetails voor verborgen Skills.
- Openbare callers krijgen alleen `200` voor al geflagde zichtbare Skills.
- Bewijs wordt geredigeerd voor openbare callers en bevat alleen ruwe snippets voor owners/moderators.

### `POST /api/v1/skills/{slug}/report`

Rapporteer een Skill voor beoordeling door een moderator. Rapporten zijn op Skill-niveau, optioneel gekoppeld aan een versie, en voeden de wachtrij voor Skill-rapporten.

Auth:

- Vereist een API-token.

Request:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Response:

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

### `POST /api/v1/skills/{slug}/appeal`

Endpoint voor Skill-owner/publisher om moderatie op een Skill aan te vechten.

Auth:

- Vereist een API-token voor de Skill-owner of publisher-lid.

Request:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Beroepen worden geaccepteerd voor verborgen, verwijderde, verdachte, kwaadaardige of door de scanner geflagde Skill-uitkomsten. ClawHub houdt één open beroep per Skill bij.

Response:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

Vraagt een beveiligingsrescan aan voor de laatst gepubliceerde Skill-versie.

Auth:

- Vereist een API-token voor de Skill-owner, publisher-admin, platformmoderator of platformadmin.
- Owners en publisher-admins vallen onder de owner-herstellimiet per versie. Platformmoderators en admins niet, maar ClawHub staat nog steeds slechts één actieve rescan per versie toe.

Response:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Moderator-/admin-endpoint voor intake van Skill-rapporten.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): integer (1-200)
- `cursor` (optioneel): pagineringscursor

Response:

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

Moderator-/admin-endpoint voor het oplossen of heropenen van Skill-rapporten.

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer `status` terug wordt gezet naar `open`. Geef `finalAction: "hide"` mee met een getriaged rapport om de Skill in dezelfde auditeerbare workflow te verbergen.

### `GET /api/v1/skills/-/appeals`

Moderator-/admin-endpoint voor intake van Skill-beroepen.

Queryparameters:

- `status` (optioneel): `open` (standaard), `accepted`, `rejected` of `all`
- `limit` (optioneel): integer (1-200)
- `cursor` (optioneel): pagineringscursor

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Moderator-/admin-endpoint voor het accepteren, afwijzen of heropenen van een Skill-beroep.
`note` is vereist voor `accepted` en `rejected`; het mag worden weggelaten wanneer `status` terug wordt gezet naar `open`. Geef `finalAction: "restore"` mee met een geaccepteerd beroep om de Skill weer beschikbaar te maken.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): paginatiecursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata + bestandenlijst.

- `version.security` bevat genormaliseerde verificatiestatus van scans en scannergegevens
  (VirusTotal + LLM), wanneer beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert verificatiegegevens van de beveiligingsscan voor een Skill-versie.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scannerspecifieke gegevens.
- `security.capabilityTags` bevat deterministische capability-/risicolabels zoals
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` en `posts-externally` wanneer gedetecteerd.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft geproduceerd (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiesnapshot op Skill-niveau, afgeleid van de nieuwste versie.
- Wanneer je een historische versie opvraagt, controleer dan `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext behandelt.

### `GET /api/v1/skills/{slug}/file`

Retourneert ruwe tekstinhoud.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard de nieuwste versie.
- Limiet voor bestandsgrootte: 200 KB.

### `GET /api/v1/packages`

Uniforme catalogusendpoint voor:

- Skills
- code-Plugins
- bundle-Plugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capability-filter voor Plugin-pakketten
- `target` / `hostTarget` (optioneel): verkorte notatie voor `host:<target>`
- `os`, `arch`, `libc` (optioneel): verkorte notatie voor host-capability-filters
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optioneel): verkorte notatie `true`/`1` voor labels voor omgevingsvereisten
- `externalService`, `binary`, `osPermission` (optioneel): verkorte notatie voor benoemde
  labels voor omgevingsvereisten
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om door ClawPack ondersteunde pakketversies te tonen
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met vaste familie.
- Skill-items blijven ondersteund door het Skill-register en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds alleen voor code-plugin- en bundle-plugin-releases.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen private pakketten zien voor publishers waartoe ze behoren in lijst-/zoekresultaten.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Uniform zoeken in de catalogus over Skills + Plugin-pakketten.

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capability-filter voor Plugin-pakketten
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` en
  `osPermission` worden geaccepteerd als verkorte notaties voor gangbare capability-labels
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om door ClawPack ondersteunde pakketversies te zoeken
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen private pakketten zoeken voor publishers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.
- Artefactfilters worden ondersteund door geïndexeerde capability-labels:
  `artifact:legacy-zip`, `artifact:npm-pack` en `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retourneert detailmetadata van het pakket.

Opmerkingen:

- Skills kunnen in de uniforme catalogus ook via deze route worden opgelost.
- Private pakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `DELETE /api/v1/packages/{name}`

Soft-deletet een pakket en alle releases.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een org-publisher-eigenaar/-beheerder,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor

Opmerkingen:

- Private pakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
capabilities, verificatie, artefactmetadata en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor pakketarchieven uit de oude wereld of
  `npm-pack` voor door ClawPack ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden opgenomen wanneer scangegevens bestaan.
- Private pakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete artefactresolvermetadata voor een pakketversie.

Opmerkingen:

- Legacy-pakketversies retourneren een `legacy-zip`-artefact en een legacy-ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de legacy-ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; het voorkomt gissen naar het archiefformaat op basis van
  een gedeelde URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen de exacte geüploade npm-pack `.tgz`-bytes.
- Legacy-ZIP-versies leiden om naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadrate-bucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstig OpenClaw-gebruik.

Gereedheidscontroles omvatten:

- status van officieel kanaal
- beschikbaarheid van nieuwste versie
- beschikbaarheid van ClawPack npm-pack-artefact
- artefact-digest
- herkomst van bronrepo en commit
- OpenClaw-compatibiliteitsmetadata
- hostdoelen
- scanstatus

Response:

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

Moderatorendpoint voor het weergeven van officiële OpenClaw Plugin-migratierijen.

Auth:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Response:

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

Beheerdersendpoint voor het aanmaken of bijwerken van een officiële Plugin-migratierij.

Auth:

- Vereist een API-token voor een beheerder.

Request body:

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

Opmerkingen:

- `bundledPluginId` wordt genormaliseerd naar kleine letters en is de stabiele upsert-sleutel.
- `packageName` wordt genormaliseerd als npm-naam; het pakket kan ontbreken voor geplande
  migraties.
- Dit volgt alleen migratiegereedheid. Het wijzigt OpenClaw niet en genereert geen
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdersendpoint voor beoordelingswachtrijen van pakketreleases.

Auth:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Betekenissen van statussen:

- `open`: verdachte, schadelijke, in behandeling zijnde, in quarantaine geplaatste, ingetrokken of gerapporteerde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of schadelijke releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketrapportage.

Response:

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

Rapporteer een pakket voor beoordeling door een moderator. Rapportages zijn op pakketniveau, optioneel
gekoppeld aan een versie. Ze voeden de moderatiewachtrij, maar verbergen niets automatisch en
blokkeren downloads niet op zichzelf; moderators moeten releasemoderatie gebruiken om
artefacten goed te keuren, in quarantaine te plaatsen of in te trekken.

Auth:

- Vereist een API-token.

Request:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Response:

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

### `POST /api/v1/packages/{name}/appeal`

Endpoint voor pakketeigenaar/publisher om bezwaar te maken tegen moderatie op een release.

Auth:

- Vereist een API-token voor de pakketeigenaar of een publisher-lid.

Request:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Bezwaar wordt alleen geaccepteerd voor releases die in quarantaine geplaatst, ingetrokken,
verdacht of schadelijk zijn. ClawHub bewaart één open bezwaar per release.

Response:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

Vraagt een beveiligingsrescan aan voor de laatst gepubliceerde pakketrelease.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, publicatiebeheerder, platformmoderator of platformbeheerder.
- Eigenaren en publicatiebeheerders vallen onder de herstel-limiet per release voor eigenaren. Platformmoderators en beheerders niet, maar ClawHub staat nog steeds slechts één actieve rescan per release toe.

Respons:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

Moderator-/beheerdersendpoint voor de intake van pakketbezwaren.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `status` (optioneel): `open` (standaard), `accepted`, `rejected` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringcursor

Respons:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

Moderator-/beheerdersendpoint voor het accepteren, afwijzen of opnieuw openen van een bezwaar.

Verzoek:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` is vereist voor `accepted` en `rejected`; het mag worden weggelaten wanneer `status` terug naar `open` wordt gezet. Geef `finalAction: "approve"` mee met een geaccepteerd bezwaar om de betreffende release in dezelfde auditeerbare workflow goed te keuren.

Respons:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

Moderator-/beheerdersendpoint voor de intake van pakketmeldingen.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringcursor

Respons:

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

Eigenaar-/moderatorendpoint voor zichtbaarheid van pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, publicatielid, moderator of beheerder.

Respons:

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

Moderator-/beheerdersendpoint voor het oplossen of opnieuw openen van pakketmeldingen.

Verzoek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer `status` terug naar `open` wordt gezet. Geef `finalAction: "quarantine"` of `finalAction: "revoke"` mee met een bevestigde melding om releasemoderatie toe te passen in dezelfde auditeerbare workflow.

Respons:

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

Moderator-/beheerdersendpoint voor beoordeling van pakketreleases.

Verzoek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van opvolging.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases retourneren `403` vanuit routes voor artifactdownloads. Elke wijziging schrijft een vermelding naar het auditlogboek.

### `POST /api/v1/packages/backfill/artifacts`

Onderhoudsendpoint alleen voor beheerders om oudere pakketreleases te labelen met expliciete metadata voor het artifacttype.

Verzoekbody:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Respons:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Opmerkingen:

- Standaard ingesteld op dry-run.
- Releases zonder ClawPack-opslag worden gelabeld als `legacy-zip`.
- Bestaande rijen die door ClawPack worden ondersteund en `artifactKind` missen, worden gerepareerd als `npm-pack`.
- Dit genereert geen ClawPacks en wijzigt geen artifactbytes.

### `GET /api/v1/packages/{name}/file`

Retourneert ruwe tekstinhoud voor een pakketbestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard wordt de nieuwste release gebruikt.
- Gebruikt de leesratelimitbucket, niet de downloadbucket.
- Binaire bestanden retourneren `415`.
- Bestandsgroottelimiet: 200 KB.
- Lopende VirusTotal-scans blokkeren leesacties niet; kwaadaardige releases kunnen elders nog steeds worden achtergehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaarspublicatie kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard wordt de nieuwste release gebruikt.
- Skills leiden om naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zipbestanden met een `package/`-root, zodat oude OpenClaw-clients blijven werken.
- Deze route blijft alleen ZIP. Er worden geen ClawPack `.tgz`-bestanden gestreamd.
- Responsen bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door resolvers.
- Registry-only metadata wordt niet in het gedownloade archief geïnjecteerd.
- Lopende VirusTotal-scans blokkeren downloads niet; kwaadaardige releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibel packument voor pakketversies die door ClawPack worden ondersteund.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Verouderde ZIP-only-versies worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele velden, zodat gebruikers npm naar de mirror kunnen laten wijzen als ze daarvoor kiezen.
- Packuments voor scoped pakketten ondersteunen zowel `/api/npm/@scope/name` als het door npm gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exact geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadratelimitbucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm integrity-/shasum-metadata.
- Moderatie- en toegangscontroles voor privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Wordt door de CLI gebruikt om een lokale vingerafdruk aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): 64 tekens lange hex-sha256 van de bundelvingerafdruk

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een zip van een Skills-versie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-string
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Zacht verwijderde versies retourneren `410`.
- Downloadstatistieken worden geteld als unieke identiteiten per uur (`userId` wanneer het API-token geldig is, anders IP).

## Authenticatie-endpoints (Bearer-token)

Alle endpoints vereisen:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valideert het token en retourneert de gebruikershandle.

### `POST /api/v1/skills`

Publiceert een nieuwe versie.

- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (gebaseerd op storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Wanneer aanwezig, lost de API die publicatie server-side op en vereist dat de actor publicatietoegang heeft.
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, mag een bestaande Skills naar die eigenaar worden verplaatst als de actor beheerder/eigenaar is bij zowel de huidige als de doelpublicatie. Zonder deze opt-in worden eigenaarswijzigingen geweigerd.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist authenticatie met Bearer-token.
- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (gebaseerd op storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Wanneer aanwezig, mogen alleen beheerders namens die eigenaar publiceren.

Belangrijkste validatiepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack `.tgz`-uploads moeten dit bevatten op `package/openclaw.plugin.json`.
- Code-Plugins vereisen `package.json`, bronrepositorymetadata, broncommitmetadata, configschemametadata, `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen vertrouwde publicaties mogen naar het `official`-kanaal publiceren.
- Publicaties namens iemand anders valideren nog steeds de geschiktheid voor het officiële kanaal tegen het doel-eigenaarsaccount.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Zacht verwijderen / herstellen van een Skills (eigenaar, moderator of beheerder).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wanneer aanwezig, wordt `reason` opgeslagen als moderatienotitie voor de Skills en gekopieerd naar het auditlogboek.
Door de eigenaar geïnitieerde zachte verwijderingen reserveren de slug 30 dagen, waarna de slug door
een andere publicatie kan worden geclaimd. De verwijderrespons bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties en beveiligingsverwijderingen door moderators/beheerders verlopen niet op deze manier.

Verwijderrespons:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: niet geauthenticeerd
- `403`: verboden
- `404`: Skills/gebruiker niet gevonden
- `500`: interne serverfout

### `POST /api/v1/users/publisher`

Alleen voor beheerders. Zorgt dat er een organisatiepublicatie bestaat voor een handle. Als de handle nog steeds naar een
verouderde gedeelde gebruikers-/persoonlijke publicatie verwijst, migreert het endpoint deze eerst naar een organisatiepublicatie.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Alleen voor beheerders. Reserveert root-slugs en pakketnamen voor een rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden privé-placeholderpakketten zonder releaseregels, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release onder die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Eindpunten voor beheer van eigenaars-slugs

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide eindpunten vereisen authenticatie met een API-token en werken alleen voor de eigenaar van de skill.
- `rename` behoudt de vorige slug als redirect-alias.
- `merge` verbergt de bronvermelding en leidt de bron-slug door naar de doelvermelding.

### Eindpunten voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (accepteren/weigeren/annuleren): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Responsvorm: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blokkeer een gebruiker en verwijder eigen skills definitief (alleen moderator/beheerder).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Respons:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Hef de blokkering van een gebruiker op en herstel in aanmerking komende skills (alleen beheerder).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Respons:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Wijzig de rol van een gebruiker (alleen beheerder).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

of

```json
{ "userId": "users_...", "role": "admin" }
```

Respons:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Gebruikers weergeven of zoeken (alleen beheerder).

Queryparameters:

- `q` (optioneel): zoekquery
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximumaantal resultaten (standaard 20, max. 200)

Respons:

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

Voeg een ster toe of verwijder er een (markeringen). Beide eindpunten zijn idempotent.

Responsen:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Verouderde CLI-eindpunten (afgeschaft)

Nog steeds ondersteund voor oudere CLI-versies:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Zie `DEPRECATIONS.md` voor het verwijderingsplan.

## Registry-detectie (`/.well-known/clawhub.json`)

De CLI kan registry-/auth-instellingen van de site detecteren:

- `/.well-known/clawhub.json` (JSON, aanbevolen)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, serveer dan dit bestand (of stel `CLAWHUB_REGISTRY` expliciet in; legacy `CLAWDHUB_REGISTRY`).
