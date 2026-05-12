---
read_when:
    - Eindpunten toevoegen/wijzigen
    - Foutopsporing voor CLI ↔ registerverzoeken
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-05-12T00:56:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden staan onder `/api/v1/...`.
Verouderde `/api/...` en `/api/cli/...` blijven bestaan voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van openbare catalogus

Directory's van derden mogen de openbare lees-endpoints gebruiken om ClawHub Skills te tonen of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/<slug>`) en wek niet de indruk dat ClawHub de site van de derde partij onderschrijft. Probeer verborgen, privé- of door moderatie geblokkeerde inhoud niet buiten het openbare API-oppervlak te spiegelen.

Web-slug-snelkoppelingen worden over registry-families heen opgelost, maar API-clients moeten de canonieke URL's gebruiken die door lees-endpoints worden teruggegeven in plaats van routeprioriteit te reconstrueren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme verzoeken: gehandhaafd per IP.
- Geauthenticeerde verzoeken (geldige Bearer-token): gehandhaafd per gebruikersbucket.
- Als de token ontbreekt/ongeldig is, valt het gedrag terug op IP-handhaving.
- Geauthenticeerde schrijf-endpoints mogen geen kale `Unauthorized` teruggeven wanneer de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en verwijderde/verbannen/uitgeschakelde accounts moeten elk bruikbare tekst krijgen zodat CLI-clients gebruikers kunnen vertellen wat hen blokkeerde.

- Lezen: 600/min per IP, 2400/min per sleutel
- Schrijven: 45/min per IP, 180/min per sleutel
- Downloaden: 30/min per IP, 180/min per sleutel (`/api/v1/download`)

Headers:

- Compatibiliteit met legacy: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bij `429`: `Retry-After`

Headersemantiek:

- `X-RateLimit-Reset`: absolute Unix-epochseconden
- `RateLimit-Reset`: seconden tot reset (vertraging)
- `Retry-After`: seconden wachten voordat opnieuw wordt geprobeerd (vertraging) bij `429`

Voorbeeld van `429`-antwoord:

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

- Als `Retry-After` bestaat, wacht dan dat aantal seconden voordat je het opnieuw probeert.
- Gebruik backoff met jitter om gesynchroniseerde nieuwe pogingen te vermijden.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken dit op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt standaard `cf-connecting-ip` (Cloudflare) voor het client-IP.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als er geen vertrouwd client-IP beschikbaar is, gebruiken anonieme downloadverzoeken een endpoint-specifieke fallback-bucket in plaats van één globale `ip:unknown`-bucket. Anonieme lees-/schrijfverzoeken gebruiken nog steeds de gedeelde onbekende bucket, zodat routering met ontbrekend IP zichtbaar en conservatief blijft.

## Openbare endpoints (geen auth)

### `GET /api/v1/search`

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte Skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Antwoord:

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

- Resultaten worden teruggegeven op relevantievolgorde (embedding-overeenkomst + boosts voor exacte slug-/naamtoken + populariteitsprior op basis van downloads).
- Relevantie is sterker dan populariteit. Een precieze slug- of weergavenaamtokenmatch kan hoger scoren dan een lossere match met veel meer downloads.
- ASCII-tekst wordt getokeniseerd op woord- en interpunctiegrenzen. Bijvoorbeeld: `personal-map` bevat een zelfstandige `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale match dan `amap-jsapi-skill`.
- Downloads worden gebruikt als een kleine log-geschaalde prior en tie-breaker, niet als primair rankingsignaal. Skills met veel downloads kunnen lager scoren wanneer de querytekst een zwakkere match is.
- Een verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van callerfilters en de huidige moderatiestatus.

Richtlijnen voor vindbaarheid voor uitgevers:

- Zet de termen waar gebruikers letterlijk naar zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandige slug-token wanneer dit ook een stabiele identiteit is die je wilt behouden.
- Wijzig een slug niet alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirect-aliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemingsaliassen behouden resolutie voor oude URL's en installaties die via de registry worden opgelost, maar zoekranking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect <slug>` terwijl je bent ingelogd voordat je rankinggerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1–200)
- `cursor` (optioneel): paginatiecursor voor elke niet-`trending`-sortering
- `sort` (optioneel): `updated` (standaard), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Opmerkingen:

- `trending` rangschikt op installaties in de afgelopen 7 dagen (op basis van telemetry).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursor-gebaseerde sorteringen minder dan `limit` items op een pagina teruggeven omdat verdachte Skills na het ophalen van de pagina worden gefilterd.
- Gebruik `nextCursor` om de paginatie voort te zetten wanneer aanwezig. Een korte pagina betekent op zichzelf niet dat het einde van de resultaten is bereikt.

Antwoord:

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

Antwoord:

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

- Oude slugs die zijn aangemaakt door owner-hernoemings-/mergeflows worden opgelost naar de canonieke Skill.
- `metadata.os`: OS-beperkingen die in de frontmatter van de Skill zijn gedeclareerd (bijv. `["macos"]`, `["linux"]`). `null` indien niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` indien niet gedeclareerd.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is gemarkeerd of de eigenaar deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Geeft gestructureerde moderatiestatus terug.

Antwoord:

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
- Bewijs wordt geredigeerd voor openbare callers en bevat alleen ruwe fragmenten voor eigenaren/moderators.

### `POST /api/v1/skills/{slug}/report`

Meld een Skill voor moderatiereview. Meldingen zijn op Skill-niveau, kunnen optioneel aan een versie worden gekoppeld en voeden de wachtrij voor Skill-meldingen.

Auth:

- Vereist een API-token.

Verzoek:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Antwoord:

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

Moderator-/admin-endpoint voor intake van Skill-meldingen.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): paginatiecursor

Antwoord:

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

Moderator-/admin-endpoint voor het oplossen of heropenen van Skill-meldingen.

Verzoek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer `status` terug wordt gezet naar `open`. Geef `finalAction: "hide"` mee met een getriageerde melding om de Skill in dezelfde auditeerbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): paginatiecursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Geeft versiemetadata + bestandenlijst terug.

- `version.security` bevat genormaliseerde verificatiestatus van scans en scannergegevens
  (VirusTotal + LLM), indien beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Geeft verificatiedetails van securityscans voor een Skill-versie terug.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scanner-specifieke details.
- `security.capabilityTags` bevat deterministische capability-/risicolabels zoals
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` en `posts-externally` wanneer gedetecteerd.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel produceerde (`clean`, `suspicious` of `malicious`).
- `moderation` is een huidige moderatiesnapshot op Skill-niveau die is afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext behandelt.

### `GET /api/v1/skills/{slug}/file`

Geeft ruwe tekstinhoud terug.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste versie.
- Limiet bestandsgrootte: 200KB.

### `GET /api/v1/packages`

Uniform catalogus-endpoint voor:

- Skills
- code-Plugins
- bundel-Plugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capaciteitsfilter voor Plugin-pakketten
- `target` / `hostTarget` (optioneel): verkorte notatie voor `host:<target>`
- `os`, `arch`, `libc` (optioneel): verkorte notatie voor hostcapaciteitsfilters
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optioneel): `true`/`1` als verkorte notatie voor tags voor omgevingsvereisten
- `externalService`, `binary`, `osPermission` (optioneel): verkorte notatie voor benoemde
  tags voor omgevingsvereisten
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om ClawPack-ondersteunde pakketversies te tonen
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met een vaste family.
- Skill-vermeldingen blijven ondersteund door het Skill-register en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds alleen bedoeld voor releases van code-plugin en bundle-plugin.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen in lijst-/zoekresultaten privépakketten zien voor publishers waartoe zij behoren.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Geünificeerde cataloguszoekactie over Skills + Plugin-pakketten.

Queryparameters:

- `q` (verplicht): zoektekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capaciteitsfilter voor Plugin-pakketten
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` en
  `osPermission` worden geaccepteerd als verkorte notaties voor gangbare capaciteitstags
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om te zoeken naar ClawPack-ondersteunde pakketversies
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen privépakketten doorzoeken voor publishers waartoe zij behoren.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper kan lezen.
- Artefactfilters worden ondersteund door geïndexeerde capaciteitstags:
  `artifact:legacy-zip`, `artifact:npm-pack` en `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retourneert detailmetadata van het pakket.

Opmerkingen:

- Skills kunnen ook via deze route in de geünificeerde catalogus worden opgelost.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases zacht.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de org-publisher,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor

Opmerkingen:

- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
capaciteiten, verificatie, artefactmetadata en scandata.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor oude pakketarchieven of
  `npm-pack` voor ClawPack-ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden opgenomen wanneer scandata bestaat.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete artefactresolvermetadata voor een pakketversie.

Opmerkingen:

- Oude pakketversies retourneren een `legacy-zip`-artefact en een oude ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de compatibiliteits-URL voor oude ZIP.
- Dit is het resolveroppervlak van OpenClaw; het voorkomt het raden van het archiefformaat op basis van
  een gedeelde URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen exact de geüploade npm-pack `.tgz`-bytes.
- Oude ZIP-versies verwijzen door naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadratebucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstig OpenClaw-gebruik.

Gereedheidscontroles omvatten:

- status van officieel kanaal
- beschikbaarheid van nieuwste versie
- beschikbaarheid van ClawPack npm-pack-artefact
- artefactdigest
- herkomst van bronrepo en commit
- compatibiliteitsmetadata van OpenClaw
- hostdoelen
- scanstatus

Respons:

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

Moderatorendpoint voor het weergeven van migratierijen van officiële OpenClaw-Plugins.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Respons:

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

Beheerdersendpoint voor het maken of bijwerken van een migratierij voor een officiële Plugin.

Authenticatie:

- Vereist een API-token voor een beheerdersgebruiker.

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

- `bundledPluginId` wordt genormaliseerd naar kleine letters en is de stabiele upsert-sleutel.
- `packageName` wordt als npm-naam genormaliseerd; het pakket kan ontbreken voor geplande
  migraties.
- Dit houdt alleen migratiegereedheid bij. Het muteert OpenClaw niet en genereert geen
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdersendpoint voor beoordelingswachtrijen van pakketreleases.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Betekenis van statussen:

- `open`: verdachte, kwaadaardige, in behandeling zijnde, in quarantaine geplaatste, ingetrokken of gerapporteerde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of kwaadaardige releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketrapport.

Respons:

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

Rapporteer een pakket voor beoordeling door een moderator. Rapporten zijn op pakketniveau en optioneel
gekoppeld aan een versie. Ze voeden de moderatiewachtrij, maar verbergen niets automatisch en
blokkeren zelf geen downloads; moderators moeten releasemoderatie gebruiken om artefacten
goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Request:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Respons:

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

Moderator-/beheerdersendpoint voor de intake van pakketrapporten.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

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

Eigenaar-/moderatorendpoint voor zichtbaarheid van pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, publisher-lid, moderator of
  beheerdersgebruiker.

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

Moderator-/beheerdersendpoint voor het oplossen of heropenen van pakketrapporten.

Request:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` wordt teruggezet naar `open`. Geef `finalAction: "quarantine"` of
`finalAction: "revoke"` door met een bevestigd rapport om releasemoderatie toe te passen in dezelfde
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

Moderator-/admin-eindpunt voor beoordeling van package-releases.

Aanvraag:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van opvolging.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases retourneren `403` vanuit artifact-downloadroutes.
Elke wijziging schrijft een auditlogvermelding.

### `POST /api/v1/packages/backfill/artifacts`

Admin-only onderhoudseindpunt voor het labelen van oudere package-releases met
expliciete artifact-kind-metadata.

Request body:

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

- Standaard ingesteld op dry-run.
- Releases zonder ClawPack-opslag worden gelabeld als `legacy-zip`.
- Bestaande door ClawPack ondersteunde rijen zonder `artifactKind` worden gerepareerd als
  `npm-pack`.
- Dit genereert geen ClawPacks en wijzigt geen artifact-bytes.

### `GET /api/v1/packages/{name}/file`

Retourneert ruwe tekstinhoud voor een package-bestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard wordt de nieuwste release gebruikt.
- Gebruikt de leesratebucket, niet de downloadbucket.
- Binaire bestanden retourneren `415`.
- Bestandsgroottelimiet: 200 KB.
- In behandeling zijnde VirusTotal-scans blokkeren leesacties niet; kwaadaardige releases kunnen elders nog steeds worden tegengehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het legacy deterministische ZIP-archief voor een package-release.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard wordt de nieuwste release gebruikt.
- Skills verwijzen door naar `GET /api/v1/download`.
- Plugin-/package-archieven zijn zipbestanden met een `package/`-root, zodat oude OpenClaw
  clients blijven werken.
- Deze route blijft alleen ZIP. Ze streamt geen ClawPack `.tgz`-bestanden.
- Antwoorden bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en
  `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door resolvers.
- Registry-only metadata wordt niet in het gedownloade archief geïnjecteerd.
- In behandeling zijnde VirusTotal-scans blokkeren downloads niet; kwaadaardige releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibele packument voor door ClawPack ondersteunde package-versies.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Legacy versies die alleen ZIP zijn, worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden, zodat gebruikers npm naar de mirror kunnen laten wijzen als ze dat willen.
- Scoped package-packuments ondersteunen zowel `/api/npm/@scope/name` als npm's
  gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exacte geüploade ClawPack-tarball-bytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadratebucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm-integriteits-/shasum-metadata.
- Moderatie- en toegangscontroles voor privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Gebruikt door de CLI om een lokale fingerprint aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): 64-tekens hex sha256 van de bundelfingerprint

Antwoord:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een zip van een skill-versie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-string
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Soft-deleted versies retourneren `410`.
- Downloadstatistieken worden geteld als unieke identiteiten per uur (`userId` wanneer het API-token geldig is, anders IP).

## Auth-eindpunten (Bearer-token)

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
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, mag een
  bestaande skill naar die eigenaar worden verplaatst als de actor admin/eigenaar is op zowel
  de huidige als de doeluitgever. Zonder deze opt-in worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist Bearer-token-authenticatie.
- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, mogen alleen admins namens die eigenaar publiceren.

Validatiehoogtepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack `.tgz`-uploads moeten
  dit bevatten op `package/openclaw.plugin.json`.
- Code-plugins vereisen `package.json`, bronrepo-metadata, broncommitmetadata,
  configschemametadata, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen vertrouwde uitgevers mogen naar het `official`-kanaal publiceren.
- Publicaties namens iemand anders valideren nog steeds of het doeleigenaarsaccount in aanmerking komt voor het official-kanaal.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / herstel een skill (eigenaar, moderator of admin).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Indien aanwezig wordt `reason` opgeslagen als de moderatienotitie voor de skill en gekopieerd naar het auditlog.
Door de eigenaar geïnitieerde soft deletes reserveren de slug 30 dagen; daarna kan de slug worden geclaimd door
een andere uitgever. Het delete-antwoord bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties door moderator/admin en beveiligingsverwijderingen verlopen niet op deze manier.

Delete-antwoord:

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

Admin-only. Zorgt dat er een org-uitgever bestaat voor een handle. Als de handle nog naar een
legacy gedeelde gebruikers-/persoonlijke uitgever wijst, migreert het eindpunt deze eerst naar een org-uitgever.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Antwoord: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Admin-only. Reserveert rootslugs en package-namen voor een rechtmatige eigenaar zonder een
release te publiceren. Package-namen worden private tijdelijke aanduidingpakketten zonder release-rijen, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release naar die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwoord: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Eindpunten voor eigenaarsbeheer van slugs

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwoord: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwoord: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide eindpunten vereisen API-token-authenticatie en werken alleen voor de eigenaar van de skill.
- `rename` bewaart de vorige slug als redirectalias.
- `merge` verbergt de bronvermelding en verwijst de bronslug door naar de doelvermelding.

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

Verbied een gebruiker en hard-delete eigen skills (alleen moderator/admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Antwoord:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Hef een gebruikersverbod op en herstel in aanmerking komende skills (alleen admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Antwoord:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Wijzig een gebruikersrol (alleen admin).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

of

```json
{ "userId": "users_...", "role": "admin" }
```

Antwoord:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Toon of doorzoek gebruikers (alleen admin).

Queryparameters:

- `q` (optioneel): zoekopdracht
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximaal aantal resultaten (standaard 20, max 200)

Antwoord:

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

Voeg een ster toe/verwijder een ster (highlights). Beide eindpunten zijn idempotent.

Antwoorden:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI-eindpunten (verouderd)

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

Als je self-host, serveer dit bestand (of stel `CLAWHUB_REGISTRY` expliciet in; legacy `CLAWDHUB_REGISTRY`).
