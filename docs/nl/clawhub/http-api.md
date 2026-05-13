---
read_when:
    - Eindpunten toevoegen/wijzigen
    - Foutopsporing voor CLI ↔ registerverzoeken
summary: HTTP API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-05-13T04:17:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden staan onder `/api/v1/...`.
Legacy `/api/...` en `/api/cli/...` blijven beschikbaar voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van openbare catalogus

Directories van derden mogen de openbare lees-eindpunten gebruiken om ClawHub Skills weer te geven of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/<slug>`) en vermijd de indruk dat ClawHub de site van derden onderschrijft. Probeer geen verborgen, privé- of door moderatie geblokkeerde content buiten het openbare API-oppervlak te spiegelen.

Web-slug-snelkoppelingen worden opgelost over registry-families heen, maar API-clients moeten de canonieke URL's gebruiken die door lees-eindpunten worden teruggegeven in plaats van routevoorrang opnieuw te construeren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme aanvragen: afgedwongen per IP.
- Geauthenticeerde aanvragen (geldig Bearer-token): afgedwongen per gebruikersbucket.
- Als het token ontbreekt/ongeldig is, valt het gedrag terug op IP-handhaving.
- Geauthenticeerde schrijf-eindpunten moeten geen kale `Unauthorized` retourneren wanneer de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en verwijderde/verbannen/uitgeschakelde accounts moeten elk bruikbare tekst krijgen zodat CLI-clients gebruikers kunnen vertellen wat hen blokkeerde.

- Lezen: 600/min per IP, 2400/min per sleutel
- Schrijven: 45/min per IP, 180/min per sleutel
- Downloaden: 30/min per IP, 180/min per sleutel (`/api/v1/download`)

Headers:

- Legacy-compatibiliteit: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bij `429`: `Retry-After`

Header-semantiek:

- `X-RateLimit-Reset`: absolute Unix-epochseconden
- `RateLimit-Reset`: seconden tot reset (vertraging)
- `Retry-After`: seconden wachten voordat opnieuw wordt geprobeerd (vertraging) bij `429`

Voorbeeld van `429`-respons:

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

- Als `Retry-After` bestaat, wacht dan dat aantal seconden voordat je opnieuw probeert.
- Gebruik backoff met jitter om gesynchroniseerde nieuwe pogingen te voorkomen.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken dit op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt standaard `cf-connecting-ip` (Cloudflare) voor client-IP.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als er geen vertrouwd client-IP beschikbaar is, gebruiken anonieme downloadaanvragen een eindpunt-gescopeerde fallback-bucket in plaats van één globale `ip:unknown`-bucket. Anonieme lees-/schrijfaanvragen gebruiken nog steeds de gedeelde unknown-bucket zodat routering met ontbrekend IP zichtbaar en conservatief blijft.

## Openbare eindpunten (geen auth)

### `GET /api/v1/search`

Queryparameters:

- `q` (vereist): querystring
- `limit` (optioneel): geheel getal
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte Skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Respons:

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

- Resultaten worden geretourneerd in relevantievolgorde (embedding-gelijkenis + boosts voor exacte slug-/naam-tokens + populariteitsprior op basis van downloads).
- Relevantie is sterker dan populariteit. Een precieze slug- of display-name-tokenmatch kan hoger scoren dan een lossere match met veel meer downloads.
- ASCII-tekst wordt getokenized op woord- en interpunctiegrenzen. `personal-map` bevat bijvoorbeeld een zelfstandig `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale match dan `amap-jsapi-skill`.
- Downloads worden gebruikt als kleine log-geschaalde prior en tie-breaker, niet als primair rankingsignaal. Skills met veel downloads kunnen lager ranken wanneer de querytekst een zwakkere match is.
- Verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van caller-filters en huidige moderatiestatus.

Richtlijnen voor vindbaarheid voor publishers:

- Zet de termen waar gebruikers letterlijk op zullen zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandig slug-token wanneer het ook een stabiele identiteit is die je wilt behouden.
- Hernoem een slug niet alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirect-aliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemingsaliassen behouden resolutie voor oude URL's en installaties die via de registry worden opgelost, maar zoekranking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect <slug>` terwijl je ingelogd bent voordat je rankinggerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): pagineringscursor voor elke niet-`trending`-sortering
- `sort` (optioneel): `updated` (standaard), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Opmerkingen:

- `trending` rankt op installaties in de afgelopen 7 dagen (op basis van telemetrie).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina retourneren omdat verdachte Skills na pagina-ophaling worden gefilterd.
- Gebruik `nextCursor` om paginering voort te zetten wanneer aanwezig. Een korte pagina betekent op zichzelf niet het einde van de resultaten.

Respons:

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

Respons:

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

- Oude slugs die door eigenaar-hernoemings-/mergeflows zijn aangemaakt, worden opgelost naar de canonieke Skill.
- `metadata.os`: OS-beperkingen gedeclareerd in Skill-frontmatter (bijv. `["macos"]`, `["linux"]`). `null` indien niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` indien niet gedeclareerd.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is gemarkeerd of de eigenaar deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Retourneert gestructureerde moderatiestatus.

Respons:

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

- Eigenaren en moderators hebben toegang tot moderatiedetails voor verborgen Skills.
- Openbare callers krijgen alleen `200` voor al gemarkeerde zichtbare Skills.
- Bewijs wordt geredigeerd voor openbare callers en bevat alleen ruwe snippets voor eigenaren/moderators.

### `POST /api/v1/skills/{slug}/report`

Rapporteer een Skill voor beoordeling door een moderator. Rapporten zijn op Skill-niveau, optioneel gekoppeld aan een versie, en voeden de rapportagewachtrij voor Skills.

Auth:

- Vereist een API-token.

Aanvraag:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Respons:

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

Moderator-/admin-eindpunt voor inname van Skill-rapporten.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): pagineringscursor

Respons:

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

Moderator-/admin-eindpunt voor het oplossen of heropenen van Skill-rapporten.

Aanvraag:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer `status` terug naar `open` wordt gezet. Geef `finalAction: "hide"` mee met een getriageerd rapport om de Skill in dezelfde auditbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): pagineringscursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata + bestandenlijst.

- `version.security` bevat genormaliseerde status voor scanverificatie en scannergegevens
  (VirusTotal + LLM), indien beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert beveiligingsscanverificatiedetails voor een Skill-versie.

Queryparameters:

- `version` (optioneel): specifieke versiestring.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scanner-specifieke details.
- `security.capabilityTags` bevat deterministische capability-/risicolabels zoals
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` en `posts-externally` wanneer gedetecteerd.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft geproduceerd (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiesnapshot op Skill-niveau, afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext behandelt.

### `GET /api/v1/skills/{slug}/file`

Retourneert ruwe tekstinhoud.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard naar nieuwste versie.
- Limiet bestandsgrootte: 200 KB.

### `GET /api/v1/packages`

Geünificeerd cataloguseindpunt voor:

- Skills
- code-plugins
- bundle-plugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginacursor
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capaciteitsfilter voor pluginpakketten
- `target` / `hostTarget` (optioneel): afkorting voor `host:<target>`
- `os`, `arch`, `libc` (optioneel): afkorting voor hostcapaciteitsfilters
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optioneel): afkorting `true`/`1` voor tags voor omgevingsvereisten
- `externalService`, `binary`, `osPermission` (optioneel): afkorting voor benoemde
  tags voor omgevingsvereisten
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om door ClawPack ondersteunde pakketversies te tonen
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met vaste family.
- Skill-vermeldingen blijven ondersteund door het skillregister en kunnen nog steeds alleen worden gepubliceerd via `POST /api/v1/skills`.
- `POST /api/v1/packages` is nog steeds alleen voor releases van code-plugin en bundle-plugin.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen in lijst-/zoekresultaten privépakketten zien voor publishers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Geünificeerde cataloguszoekfunctie voor skills + pluginpakketten.

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capaciteitsfilter voor pluginpakketten
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` en
  `osPermission` worden geaccepteerd als afkortingen voor veelgebruikte capaciteitstags
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om door ClawPack ondersteunde pakketversies te zoeken
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen privépakketten zoeken voor publishers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.
- Artefactfilters worden ondersteund door geïndexeerde capaciteitstags:
  `artifact:legacy-zip`, `artifact:npm-pack` en `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retourneert metadata met pakketdetails.

Opmerkingen:

- Skills kunnen ook via deze route in de geünificeerde catalogus worden opgelost.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `DELETE /api/v1/packages/{name}`

Markeert een pakket en alle releases als soft-deleted.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de org-publisher,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginacursor

Opmerkingen:

- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
capaciteiten, verificatie, artefactmetadata en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor oude pakketarchieven of
  `npm-pack` voor door ClawPack ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden opgenomen wanneer scangegevens bestaan.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retourneert de exacte beveiligings- en vertrouwenssamenvatting van de pakketrelease voor installatieclients. Dit is het openbare OpenClaw-consumptieoppervlak om te bepalen of een
opgeloste release kan worden geïnstalleerd.

Authenticatie:

- Openbaar leeseindpunt. Er is geen eigenaar-, publisher-, moderator- of beheerders-token
  vereist.

Response:

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

Responsevelden:

- `package.name`, `package.displayName` en `package.family` identificeren het
  opgeloste registerpakket.
- `release.releaseId`, `release.version` en `release.createdAt` identificeren de
  exacte release die is geëvalueerd.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` en `release.npmTarballName` zijn aanwezig wanneer ze bekend zijn voor
  het releaseartefact.
- `trust.scanStatus` is de effectieve vertrouwensstatus die is afgeleid van scannerinvoer
  en handmatige releasemoderatie.
- `trust.moderationState` kan null zijn. Het is `null` wanneer er geen handmatige releasemoderatie
  bestaat.
- `trust.blockedFromDownload` is het installatiesignaal voor blokkering. OpenClaw en andere
  installatieclients moeten installatie blokkeren wanneer deze waarde `true` is, in plaats van
  blokkeringsregels opnieuw af te leiden uit scanner- of moderatievelden.
- `trust.reasons` is de lijst met uitleg voor gebruikers en audits. Redencodes
  zijn stabiele, compacte tekenreeksen zoals `manual:quarantined`, `scan:malicious`,
  `static:malicious`, `vt:suspicious` en `package:malicious`.
- `trust.pending` betekent dat een of meer vertrouwensinvoeren nog op voltooiing wachten.
- `trust.stale` betekent dat de vertrouwenssamenvatting is berekend op basis van verouderde invoer en
  moet worden behandeld als iets dat vernieuwing vereist vóór een toestemmingsbeslissing met hoge betrouwbaarheid.

Opmerkingen:

- Dit eindpunt is versie-exact. Clients moeten het aanroepen nadat ze de
  pakketversie hebben opgelost die ze willen installeren, niet alleen nadat ze de nieuwste
  pakketmetadata hebben gelezen.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.
- Dit eindpunt is bewust smaller dan moderatie-eindpunten voor eigenaren/moderators.
  Het stelt de installatiebeslissing en openbare uitleg beschikbaar, niet
  identiteiten van melders, rapportteksten, privébewijs of interne reviewtijdlijnen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete metadata van de artefactresolver voor een pakketversie.

Opmerkingen:

- Legacy-pakketversies retourneren een `legacy-zip`-artefact en een legacy ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de legacy ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; het voorkomt dat het archiefformaat uit
  een gedeelde URL moet worden geraden.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen de exacte geüploade npm-pack `.tgz`-bytes.
- Legacy ZIP-versies verwijzen door naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadsnelheidsbucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstige OpenClaw-consumptie.

Gereedheidscontroles omvatten:

- officiële kanaalstatus
- beschikbaarheid van de nieuwste versie
- beschikbaarheid van ClawPack npm-pack-artefact
- artefactdigest
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

Moderator-eindpunt voor het weergeven van officiële OpenClaw-pluginmigratierijen.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginacursor

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

Beheerders-eindpunt voor het maken of bijwerken van een officiële pluginmigratierij.

Authenticatie:

- Vereist een API-token voor een beheerder.

Requestbody:

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

- `bundledPluginId` wordt naar kleine letters genormaliseerd en is de stabiele upsert-sleutel.
- `packageName` wordt als npm-naam genormaliseerd; het pakket kan ontbreken voor geplande
  migraties.
- Dit houdt alleen migratiegereedheid bij. Het muteert OpenClaw niet en genereert
  geen ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerders-eindpunt voor reviewwachtrijen voor pakketreleases.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginacursor

Betekenissen van statussen:

- `open`: verdachte, kwaadaardige, wachtende, in quarantaine geplaatste, ingetrokken of gemelde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of kwaadaardige releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketrapport.

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

Meld een package voor beoordeling door moderators. Meldingen zijn op packageniveau, optioneel
gekoppeld aan een versie. Ze vullen de moderatiewachtrij, maar verbergen niets automatisch en
blokkeren downloads niet zelfstandig; moderators moeten releasemoderatie gebruiken om
artefacten goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Verzoek:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Antwoord:

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

Moderator-/admin-eindpunt voor de intake van packagemeldingen.

Authenticatie:

- Vereist een API-token voor een moderator of admin-gebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

Antwoord:

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

Eigenaar-/moderator-eindpunt voor zichtbaarheid van packagemoderatie.

Authenticatie:

- Vereist een API-token voor de package-eigenaar, uitgeverslid, moderator of
  admin-gebruiker.

Antwoord:

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

Moderator-/admin-eindpunt voor het oplossen of heropenen van packagemeldingen.

Verzoek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` terug naar `open` wordt gezet. Geef `finalAction: "quarantine"` of
`finalAction: "revoke"` mee met een bevestigde melding om releasemoderatie toe te passen in dezelfde
controleerbare workflow.

Antwoord:

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

Moderator-/admin-eindpunt voor beoordeling van packagereleases.

Verzoek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van vervolgactie.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

Releases in quarantaine en ingetrokken releases retourneren `403` via artefactdownloadroutes.
Elke wijziging schrijft een auditlogvermelding.

### `POST /api/v1/packages/backfill/artifacts`

Alleen-admin onderhoudseindpunt om oudere packagereleases te labelen met
expliciete metadata voor artefactsoort.

Verzoekbody:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Antwoord:

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

- Standaard een dry-run.
- Releases zonder ClawPack-opslag worden gelabeld als `legacy-zip`.
- Bestaande door ClawPack ondersteunde rijen zonder `artifactKind` worden hersteld als
  `npm-pack`.
- Dit genereert geen ClawPacks en wijzigt geen artefactbytes.

### `GET /api/v1/packages/{name}/file`

Retourneert onbewerkte tekstinhoud voor een packagebestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de leeslimietbucket, niet de downloadbucket.
- Binaire bestanden retourneren `415`.
- Limiet voor bestandsgrootte: 200 KB.
- Lopende VirusTotal-scans blokkeren leesacties niet; kwaadaardige releases kunnen elders nog worden tegengehouden.
- Privépackages retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het legacy deterministische ZIP-archief voor een packagerelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills leiden om naar `GET /api/v1/download`.
- Plugin-/packagearchieven zijn zipbestanden met een `package/`-root, zodat oude OpenClaw
  clients blijven werken.
- Deze route blijft alleen ZIP. Ze streamt geen ClawPack `.tgz`-bestanden.
- Antwoorden bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en
  `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door resolvers.
- Alleen-registermetadata wordt niet in het gedownloade archief geïnjecteerd.
- Lopende VirusTotal-scans blokkeren downloads niet; kwaadaardige releases retourneren `403`.
- Privépackages retourneren `404` tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibel packument voor door ClawPack ondersteunde packageversies.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Legacy versies met alleen ZIP worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden, zodat gebruikers npm naar de mirror kunnen laten wijzen als ze dat willen.
- Packuments voor scoped packages ondersteunen zowel `/api/npm/@scope/name` als het door npm
  gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exacte geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadlimietbucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm-integriteits-/shasum-metadata.
- Controles op moderatie en toegang tot privépackages blijven van toepassing.

### `GET /api/v1/resolve`

Gebruikt door de CLI om een lokale fingerprint aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): 64-teken hex sha256 van de bundelfingerprint

Antwoord:

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
- Soft-deleted versies retourneren `410`.
- Downloadstatistieken worden geteld als unieke identiteiten per uur (`userId` wanneer het API-token geldig is, anders IP).

## Authenticatie-eindpunten (Bearer-token)

Alle eindpunten vereisen:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valideert het token en retourneert de gebruikershandle.

### `POST /api/v1/skills`

Publiceert een nieuwe versie.

- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, lost de API die
  uitgever server-side op en vereist dat de actor uitgeverstoegang heeft.
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, kan een
  bestaande skill naar die eigenaar worden verplaatst als de actor admin/eigenaar is van zowel
  de huidige als de doeluitgever. Zonder deze expliciete toestemming worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist Bearer-tokenauthenticatie.
- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, mogen alleen admins namens die eigenaar publiceren.

Validatiepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-packages vereisen `openclaw.plugin.json`. ClawPack `.tgz`-uploads moeten
  dit bevatten op `package/openclaw.plugin.json`.
- Code-plugins vereisen `package.json`, metadata van de bronrepo, metadata van de broncommit,
  metadata van het configschema, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen vertrouwde uitgevers mogen publiceren naar het `official`-kanaal.
- Publicaties namens iemand anders valideren geschiktheid voor het officiële kanaal nog steeds tegen het doel-eigenaarsaccount.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / herstel een skill (eigenaar, moderator of admin).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Indien aanwezig, wordt `reason` opgeslagen als de moderatienotitie van de skill en gekopieerd naar het auditlog.
Door de eigenaar geïnitieerde soft deletes reserveren de slug 30 dagen; daarna kan de slug worden geclaimd door
een andere uitgever. Het verwijderingsantwoord bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties door moderators/admins en beveiligingsverwijderingen verlopen niet op deze manier.

Verwijderingsantwoord:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/gebruiker niet gevonden
- `500`: interne serverfout

### `POST /api/v1/users/publisher`

Alleen-admin. Zorgt dat er een organisatie-uitgever bestaat voor een handle. Als de handle nog steeds naar een
legacy gedeelde gebruikers-/persoonlijke uitgever wijst, migreert het eindpunt die eerst naar een organisatie-uitgever.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Antwoord: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Alleen-admin. Reserveert rootslugs en packagenamen voor een rechtmatige eigenaar zonder een
release te publiceren. Packagenamen worden privé placeholderpackages zonder releaserijen, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release onder die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwoord: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Eindpunten voor slugbeheer door eigenaren

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwoord: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwoord: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide eindpunten vereisen API-tokenauthenticatie en werken alleen voor de eigenaar van de skill.
- `rename` bewaart de vorige slug als een redirectalias.
- `merge` verbergt de bronvermelding en leidt de bronslug om naar de doelvermelding.

### Eindpunten voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Antwoord: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Antwoord (accepteren/weigeren/annuleren): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Antwoordvorm: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Verban een gebruiker en verwijder eigen Skills definitief (alleen moderator/admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Maak de verbanning van een gebruiker ongedaan en herstel in aanmerking komende Skills (alleen admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Wijzig de rol van een gebruiker (alleen admin).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

of

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Gebruikers weergeven of zoeken (alleen admin).

Queryparameters:

- `q` (optioneel): zoekopdracht
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximaal aantal resultaten (standaard 20, max 200)

Response:

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

Voeg een ster toe of verwijder er een (uitgelicht). Beide endpoints zijn idempotent.

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Verouderde CLI-endpoints (verouderd)

Nog steeds ondersteund voor oudere CLI-versies:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Zie `DEPRECATIONS.md` voor het verwijderingsplan.

## Registry-discovery (`/.well-known/clawhub.json`)

De CLI kan registry-/auth-instellingen van de site ontdekken:

- `/.well-known/clawhub.json` (JSON, aanbevolen)
- `/.well-known/clawdhub.json` (verouderd)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, bied dit bestand aan (of stel `CLAWHUB_REGISTRY` expliciet in; verouderd `CLAWDHUB_REGISTRY`).
