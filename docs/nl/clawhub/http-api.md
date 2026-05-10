---
read_when:
    - Eindpunten toevoegen/wijzigen
    - CLI ↔ registerverzoeken debuggen
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-05-10T19:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden staan onder `/api/v1/...`.
Verouderde `/api/...` en `/api/cli/...` blijven bestaan voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van openbare catalogus

Directory's van derden mogen de openbare lees-endpoints gebruiken om ClawHub Skills te tonen of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/<slug>`) en vermijd de indruk dat ClawHub de site van derden onderschrijft. Probeer verborgen, privé- of door moderatie geblokkeerde inhoud niet buiten het openbare API-oppervlak te spiegelen.

Web-slug-snelkoppelingen worden over registerfamilies heen opgelost, maar API-clients moeten de canonieke URL's gebruiken die door lees-endpoints worden geretourneerd in plaats van routeprioriteit te reconstrueren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme aanvragen: gehandhaafd per IP.
- Geauthenticeerde aanvragen (geldig Bearer-token): gehandhaafd per gebruikersbucket.
- Als het token ontbreekt/ongeldig is, valt gedrag terug op IP-handhaving.
- Geauthenticeerde schrijf-endpoints mogen geen kale `Unauthorized` retourneren wanneer de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en verwijderde/gebannde/uitgeschakelde accounts moeten elk bruikbare tekst krijgen, zodat CLI-clients gebruikers kunnen vertellen wat hen blokkeerde.

- Lezen: 600/min per IP, 2400/min per sleutel
- Schrijven: 45/min per IP, 180/min per sleutel
- Downloaden: 30/min per IP, 180/min per sleutel (`/api/v1/download`)

Headers:

- Verouderde compatibiliteit: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bij `429`: `Retry-After`

Headersemantiek:

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

- Als `Retry-After` bestaat, wacht dan zoveel seconden voordat je opnieuw probeert.
- Gebruik jittered backoff om gesynchroniseerde nieuwe pogingen te vermijden.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken vanaf `X-RateLimit-Reset`).

IP-bron:

- Gebruikt standaard `cf-connecting-ip` (Cloudflare) voor client-IP.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als er geen vertrouwd client-IP beschikbaar is, gebruiken anonieme downloadaanvragen een endpoint-gebonden fallback-bucket in plaats van één globale `ip:unknown`-bucket. Anonieme lees-/schrijfaangevragen gebruiken nog steeds de gedeelde onbekende bucket, zodat routing met ontbrekend IP zichtbaar en conservatief blijft.

## Openbare endpoints (geen auth)

### `GET /api/v1/search`

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte Skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

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

- Resultaten worden geretourneerd op relevantievolgorde (embeddinggelijkenis + boosts voor exacte slug-/naamtokens + populariteitsprior op basis van downloads).
- Relevantie is sterker dan populariteit. Een precieze slug- of weergavenaamtokenmatch kan hoger scoren dan een lossere match met veel meer downloads.
- ASCII-tekst wordt getokenized op woord- en interpunctiegrenzen. `personal-map` bevat bijvoorbeeld een zelfstandig `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale match dan `amap-jsapi-skill`.
- Downloads worden gebruikt als een kleine loggeschaalde prior en tiebreaker, niet als het primaire rangschikkingssignaal. Skills met veel downloads kunnen lager scoren wanneer de querytekst een zwakkere match is.
- Verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van bellerfilters en huidige moderatiestatus.

Richtlijnen voor vindbaarheid van publiceerders:

- Zet de termen waar gebruikers letterlijk naar zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandig slugtoken wanneer het ook een stabiele identiteit is die je wilt behouden.
- Hernoem een slug niet alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirectaliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemaliassen behouden oplossing voor oude URL's en installaties die via het register worden opgelost, maar zoekrangschikking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect <slug>` terwijl je bent ingelogd, voordat je rangschikkingsgerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1–200)
- `cursor` (optioneel): paginatiecursor voor elke niet-`trending`-sortering
- `sort` (optioneel): `updated` (standaard), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Opmerkingen:

- `trending` rangschikt op installaties in de laatste 7 dagen (op basis van telemetrie).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina retourneren omdat verdachte Skills na het ophalen van de pagina worden gefilterd.
- Gebruik `nextCursor` om de paginatie voort te zetten wanneer aanwezig. Een korte pagina betekent op zichzelf niet het einde van de resultaten.

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

- Oude slugs die zijn gemaakt door hernoem-/samenvoegflows van eigenaren worden opgelost naar de canonieke Skill.
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
- Openbare bellers krijgen alleen `200` voor al gemarkeerde zichtbare Skills.
- Bewijs wordt geredigeerd voor openbare bellers en bevat alleen onbewerkte snippets voor eigenaren/moderators.

### `POST /api/v1/skills/{slug}/report`

Meld een Skill voor moderatorbeoordeling. Meldingen zijn op Skill-niveau, optioneel gekoppeld aan een versie, en voeden de Skill-meldingswachtrij.

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

### `POST /api/v1/skills/{slug}/appeal`

Endpoint voor Skill-eigenaar/publiceerder om bezwaar te maken tegen moderatie op een Skill.

Auth:

- Vereist een API-token voor de Skill-eigenaar of publiceerderslid.

Aanvraag:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Bezwaar wordt geaccepteerd voor verborgen, verwijderde, verdachte, schadelijke of door de scanner gemarkeerde Skill-uitkomsten. ClawHub houdt één open bezwaar per Skill bij.

Respons:

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

- Vereist een API-token voor de Skill-eigenaar, publiceerdersbeheerder, platformmoderator of platformbeheerder.
- Eigenaren en publiceerdersbeheerders vallen onder de herstel-limiet per versie voor eigenaren. Platformmoderators en -beheerders niet, maar ClawHub staat nog steeds slechts één actieve rescan per versie toe.

Respons:

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

Moderator-/beheerderendpoint voor inname van Skill-meldingen.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): paginatiecursor

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

Moderator-/beheerderendpoint voor het oplossen of heropenen van Skill-meldingen.

Aanvraag:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer `status` terug naar `open` wordt gezet. Geef `finalAction: "hide"` mee met een getriageerde melding om de Skill in dezelfde auditeerbare workflow te verbergen.

### `GET /api/v1/skills/-/appeals`

Moderator-/beheerderendpoint voor inname van Skill-bezwaren.

Queryparameters:

- `status` (optioneel): `open` (standaard), `accepted`, `rejected` of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): paginatiecursor

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Moderator-/beheerderendpoint voor het accepteren, afwijzen of heropenen van een Skill-bezwaar.
`note` is vereist voor `accepted` en `rejected`; het mag worden weggelaten wanneer `status` terug naar `open` wordt gezet. Geef `finalAction: "restore"` mee met een geaccepteerd bezwaar om de Skill weer beschikbaar te maken.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): paginatiecursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata + bestandenlijst.

- `version.security` bevat genormaliseerde verificatiestatus van scans en scannergegevens
  (VirusTotal + LLM), indien beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert verificatiegegevens van beveiligingsscans voor een skillversie.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scannerspecifieke gegevens.
- `security.capabilityTags` bevat deterministische labels voor mogelijkheden/risico's zoals
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` en `posts-externally` wanneer gedetecteerd.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft geproduceerd (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiesnapshot op skillniveau, afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext behandelt.

### `GET /api/v1/skills/{slug}/file`

Retourneert onbewerkte tekstinhoud.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste versie.
- Bestandsgroottelimiet: 200 KB.

### `GET /api/v1/packages`

Eengemaakt cataloguseindpunt voor:

- skills
- code-plugins
- bundel-plugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): mogelijkhedenfilter voor pluginpakketten
- `target` / `hostTarget` (optioneel): verkorte notatie voor `host:<target>`
- `os`, `arch`, `libc` (optioneel): verkorte notatie voor hostmogelijkheidsfilters
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optioneel): `true`/`1` als verkorte notatie voor omgevingsvereiststags
- `externalService`, `binary`, `osPermission` (optioneel): verkorte notatie voor benoemde
  omgevingsvereiststags
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om door ClawPack ondersteunde pakketversies te tonen
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met vaste familie.
- Skillvermeldingen blijven ondersteund door het skillregister en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds alleen voor releases van code-plugins en bundel-plugins.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen in lijst-/zoekresultaten privé-pakketten zien voor uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Eengemaakte cataloguszoekfunctie voor skills + pluginpakketten.

Queryparameters:

- `q` (vereist): zoektekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): mogelijkhedenfilter voor pluginpakketten
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` en
  `osPermission` worden geaccepteerd als verkorte notaties voor gangbare mogelijkheidstags
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om door ClawPack ondersteunde pakketversies te zoeken
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen privé-pakketten zoeken voor uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper kan lezen.
- Artefactfilters worden ondersteund door geïndexeerde mogelijkheidstags:
  `artifact:legacy-zip`, `artifact:npm-pack` en `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retourneert detailmetadata van het pakket.

Opmerkingen:

- Skills kunnen ook via deze route in de eengemaakte catalogus worden opgelost.
- Privé-pakketten retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases zacht.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor

Opmerkingen:

- Privé-pakketten retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
mogelijkheden, verificatie, artefactmetadata en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor oude pakketarchieven of
  `npm-pack` voor door ClawPack ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden opgenomen wanneer scangegevens bestaan.
- Privé-pakketten retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete resolvermetadata van het artefact voor een pakketversie.

Opmerkingen:

- Verouderde pakketversies retourneren een `legacy-zip`-artefact en een verouderde ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de verouderde ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; het voorkomt dat het archiefformaat uit
  een gedeelde URL moet worden geraden.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen exact de geüploade npm-pack `.tgz`-bytes.
- Verouderde ZIP-versies verwijzen door naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadratebucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstige OpenClaw-consumptie.

Gereedheidscontroles omvatten:

- officiële kanaalstatus
- beschikbaarheid van de nieuwste versie
- beschikbaarheid van ClawPack npm-pack-artefact
- artefactdigest
- bronrepo- en commitprovenance
- OpenClaw-compatibiliteitsmetadata
- hosttargets
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

Moderatoreindpunt voor het weergeven van officiële migratierijen van OpenClaw-plugins.

Auth:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

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

Beheerdereindpunt voor het maken of bijwerken van een officiële migratierij voor een Plugin.

Auth:

- Vereist een API-token voor een beheerdersgebruiker.

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
- Dit volgt alleen migratiegereedheid. Het muteert OpenClaw niet en genereert geen
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdereindpunt voor beoordelingswachtrijen van pakketreleases.

Auth:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Betekenis van statussen:

- `open`: verdachte, kwaadaardige, wachtende, in quarantaine geplaatste, ingetrokken of gerapporteerde releases.
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

Rapporteer een pakket voor moderatorbeoordeling. Rapporten gelden op pakketniveau en zijn optioneel
gekoppeld aan een versie. Ze voeden de moderatiewachtrij, maar verbergen niet automatisch
downloads en blokkeren deze op zichzelf ook niet; moderators moeten releasemoderatie gebruiken om
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

Eindpunt voor pakketeigenaar/uitgever om bezwaar te maken tegen moderatie van een release.

Auth:

- Vereist een API-token voor de pakketeigenaar of een uitgeverslid.

Request:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Bezwaren worden alleen geaccepteerd voor releases die in quarantaine geplaatst, ingetrokken,
verdacht of kwaadaardig zijn. ClawHub behoudt één open bezwaar per release.

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

- Vereist een API-token voor de pakketeigenaar, publisher-admin, platformmoderator of platformadmin.
- Eigenaren en publisher-admins vallen onder de herstel-limiet per release voor eigenaren. Platformmoderators en admins niet, maar ClawHub staat nog steeds slechts één actieve rescan per release toe.

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

Moderator-/admin-endpoint voor intake van pakketbezwaar.

Authenticatie:

- Vereist een API-token voor een moderator- of admin-gebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `accepted`, `rejected` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

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

Moderator-/admin-endpoint voor het accepteren, afwijzen of heropenen van een bezwaar.

Verzoek:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` is vereist voor `accepted` en `rejected`; het mag worden weggelaten wanneer `status` weer op `open` wordt gezet. Geef `finalAction: "approve"` mee met een geaccepteerd bezwaar om de betrokken release goed te keuren in dezelfde controleerbare workflow.

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

Moderator-/admin-endpoint voor intake van pakketmeldingen.

Authenticatie:

- Vereist een API-token voor een moderator- of admin-gebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

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

Eigenaar-/moderator-endpoint voor zichtbaarheid van pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, publisher-lid, moderator of admin-gebruiker.

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

Moderator-/admin-endpoint voor het oplossen of heropenen van pakketmeldingen.

Verzoek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer `status` weer op `open` wordt gezet. Geef `finalAction: "quarantine"` of `finalAction: "revoke"` mee met een bevestigde melding om releasemoderatie toe te passen in dezelfde controleerbare workflow.

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

Moderator-/admin-endpoint voor beoordeling van pakketreleases.

Verzoek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van follow-up.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases retourneren `403` vanuit routes voor artifact-downloads. Elke wijziging schrijft een auditlogvermelding.

### `POST /api/v1/packages/backfill/artifacts`

Alleen-admin onderhoudsendpoint voor het labelen van oudere pakketreleases met expliciete metadata voor artifact-type.

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

- Standaard dry-run.
- Releases zonder ClawPack-opslag worden gelabeld als `legacy-zip`.
- Bestaande door ClawPack ondersteunde rijen zonder `artifactKind` worden gerepareerd als `npm-pack`.
- Dit genereert geen ClawPacks en wijzigt geen artifact-bytes.

### `GET /api/v1/packages/{name}/file`

Retourneert ruwe tekstinhoud voor een pakketbestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de lees-rate-bucket, niet de download-bucket.
- Binaire bestanden retourneren `415`.
- Bestandsgroottelimiet: 200 KB.
- Lopende VirusTotal-scans blokkeren leesacties niet; kwaadaardige releases kunnen elders nog steeds worden achtergehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills leiden door naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zipbestanden met een `package/`-root zodat oude OpenClaw-clients blijven werken.
- Deze route blijft alleen ZIP. Hij streamt geen ClawPack `.tgz`-bestanden.
- Responses bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door resolvers.
- Alleen-registermetadata wordt niet in het gedownloade archief geïnjecteerd.
- Lopende VirusTotal-scans blokkeren downloads niet; kwaadaardige releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibele packument voor door ClawPack ondersteunde pakketversies.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Verouderde versies die alleen ZIP zijn, worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele velden zodat gebruikers npm naar de mirror kunnen verwijzen als ze dat willen.
- Packuments voor scoped packages ondersteunen zowel `/api/npm/@scope/name` als npm's gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exacte geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de download-rate-bucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm-integriteits-/shasum-metadata.
- Moderatie- en toegangscontroles voor privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Gebruikt door de CLI om een lokale fingerprint naar een bekende versie te mappen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): 64-teken hex sha256 van de bundel-fingerprint

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een zip van een Skills-versie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-tekenreeks
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Soft-deleted versies retourneren `410`.
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
- JSON-body met `files` (op storageId gebaseerd) wordt ook geaccepteerd.
- Optioneel payload-veld: `ownerHandle`. Wanneer aanwezig, lost de API die publisher server-side op en vereist dat de actor publisher-toegang heeft.
- Optioneel payload-veld: `migrateOwner`. Wanneer `true` met `ownerHandle`, mag een bestaande skill naar die eigenaar worden verplaatst als de actor admin/eigenaar is bij zowel de huidige als de doel-publishers. Zonder deze opt-in worden eigenaarwijzigingen afgewezen.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist Bearer-token-authenticatie.
- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (op storageId gebaseerd) wordt ook geaccepteerd.
- Optioneel payload-veld: `ownerHandle`. Wanneer aanwezig, mogen alleen admins namens die eigenaar publiceren.

Validatiehoogtepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack `.tgz`-uploads moeten dit bevatten op `package/openclaw.plugin.json`.
- Code-plugins vereisen `package.json`, metadata van de bron-repo, metadata van de bron-commit, metadata van het config-schema, `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen vertrouwde publishers mogen naar het `official`-kanaal publiceren.
- Publicaties namens iemand anders valideren de geschiktheid voor het officiële kanaal nog steeds tegen het doeleigenaar-account.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / herstel een skill (eigenaar, moderator of admin).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wanneer aanwezig, wordt `reason` opgeslagen als moderatienotitie van de skill en gekopieerd naar het auditlog.
Door eigenaar geïnitieerde soft deletes reserveren de slug 30 dagen; daarna kan de slug worden geclaimd door een andere publisher. De delete-respons bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties door moderators/admins en beveiligingsverwijderingen verlopen niet op deze manier.

Delete-respons:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: niet geautoriseerd
- `403`: verboden
- `404`: skill/gebruiker niet gevonden
- `500`: interne serverfout

### `POST /api/v1/users/publisher`

Alleen-admin. Zorgt dat er een org-publisher bestaat voor een handle. Als de handle nog steeds naar een verouderde gedeelde gebruiker/persoonlijke publisher verwijst, migreert het endpoint die eerst naar een org-publisher.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Alleen beheerder. Reserveert root-slugs en pakketnamen voor een rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden privé-placeholderpakketten zonder releaserijen, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release onder die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Eindpunten voor slugbeheer door eigenaar

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide eindpunten vereisen API-tokenauthenticatie en werken alleen voor de skill-eigenaar.
- `rename` behoudt de vorige slug als redirect-alias.
- `merge` verbergt de bronvermelding en leidt de bronslug om naar de doelvermelding.

### Eindpunten voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Responsvorm: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Ban een gebruiker en verwijder skills waarvan deze eigenaar is definitief (alleen moderator/beheerder).

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

Maak een ban van een gebruiker ongedaan en herstel in aanmerking komende skills (alleen beheerder).

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

Wijzig een gebruikersrol (alleen beheerder).

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

## Registry-ontdekking (`/.well-known/clawhub.json`)

De CLI kan registry-/auth-instellingen vanaf de site ontdekken:

- `/.well-known/clawhub.json` (JSON, aanbevolen)
- `/.well-known/clawdhub.json` (verouderd)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, serveer dit bestand (of stel `CLAWHUB_REGISTRY` expliciet in; verouderd: `CLAWDHUB_REGISTRY`).
