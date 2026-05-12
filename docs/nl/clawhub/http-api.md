---
read_when:
    - Eindpunten toevoegen/wijzigen
    - CLI ↔ registerverzoeken debuggen
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-05-12T04:09:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden staan onder `/api/v1/...`.
Verouderde `/api/...` en `/api/cli/...` blijven bestaan voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van openbare catalogus

Directory's van derden mogen de openbare lees-eindpunten gebruiken om ClawHub Skills te tonen of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/<slug>`) en vermijd de indruk dat ClawHub de site van derden onderschrijft. Probeer geen verborgen, privé- of door moderatie geblokkeerde inhoud buiten het openbare API-oppervlak te spiegelen.

Web-slug-snelkoppelingen worden over registry-families heen opgelost, maar API-clients moeten
de canonieke URL's gebruiken die door lees-eindpunten worden geretourneerd in plaats van route-
voorrang te reconstrueren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme verzoeken: gehandhaafd per IP.
- Geauthenticeerde verzoeken (geldig Bearer-token): gehandhaafd per gebruikersbucket.
- Als het token ontbreekt/ongeldig is, valt het gedrag terug op IP-handhaving.
- Geauthenticeerde schrijfeindpunten mogen geen kale `Unauthorized` teruggeven wanneer
  de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en
  verwijderde/verbannen/uitgeschakelde accounts moeten elk bruikbare tekst krijgen zodat CLI-
  clients gebruikers kunnen vertellen wat hen blokkeerde.

- Lezen: 600/min per IP, 2400/min per sleutel
- Schrijven: 45/min per IP, 180/min per sleutel
- Downloaden: 30/min per IP, 180/min per sleutel (`/api/v1/download`)

Headers:

- Legacy-compatibiliteit: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bij `429`: `Retry-After`

Headersemantiek:

- `X-RateLimit-Reset`: absolute Unix epoch-seconden
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

- Als `Retry-After` bestaat, wacht dan zoveel seconden voordat je het opnieuw probeert.
- Gebruik jittered backoff om gesynchroniseerde nieuwe pogingen te voorkomen.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt standaard `cf-connecting-ip` (Cloudflare) voor client-IP.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als er geen vertrouwd client-IP beschikbaar is, gebruiken anonieme downloadverzoeken een eindpunt-gebonden fallback-bucket in plaats van één globale `ip:unknown`-bucket. Anonieme lees-/schrijfverzoeken gebruiken nog steeds de gedeelde onbekende bucket, zodat routing met ontbrekende IP zichtbaar en conservatief blijft.

## Openbare eindpunten (geen auth)

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

- Resultaten worden geretourneerd op relevantievolgorde (embedding-overeenkomst + exacte slug-/naamtoken-boosts + populariteitsprior op basis van downloads).
- Relevantie is sterker dan populariteit. Een exacte overeenkomst met een slug of display-name-token kan hoger scoren dan een lossere overeenkomst met veel meer downloads.
- ASCII-tekst wordt getokenized op woord- en interpunctiegrenzen. Bijvoorbeeld: `personal-map` bevat een zelfstandig `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale overeenkomst dan `amap-jsapi-skill`.
- Downloads worden gebruikt als een kleine log-geschaalde prior en tiebreaker, niet als primair rangschikkingssignaal. Skills met veel downloads kunnen lager scoren wanneer de querytekst een zwakkere overeenkomst is.
- Verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van bellerfilters en huidige moderatiestatus.

Richtlijnen voor vindbaarheid voor uitgevers:

- Zet de termen waar gebruikers letterlijk naar zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandig slug-token wanneer het ook een stabiele identiteit is die je wilt behouden.
- Hernoem een slug niet alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirect-aliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemingsaliassen behouden resolutie voor oude URL's en installaties die via de registry worden opgelost, maar zoekrangschikking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect <slug>` terwijl je bent ingelogd voordat je rangschikkingsgerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1–200)
- `cursor` (optioneel): pagineringscursor voor elke niet-`trending` sortering
- `sort` (optioneel): `updated` (standaard), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): legacy-alias voor `nonSuspiciousOnly`

Opmerkingen:

- `trending` rangschikt op installaties in de afgelopen 7 dagen (op basis van telemetrie).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina retourneren omdat verdachte Skills na het ophalen van de pagina worden gefilterd.
- Gebruik `nextCursor` om door te gaan met pagineren wanneer aanwezig. Een korte pagina betekent op zichzelf niet het einde van de resultaten.

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

- Oude slugs die door eigenaarhernoemings-/samenvoegingsflows zijn gemaakt, worden opgelost naar de canonieke Skill.
- `metadata.os`: OS-beperkingen die zijn gedeclareerd in Skill-frontmatter (bijv. `["macos"]`, `["linux"]`). `null` indien niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` indien niet gedeclareerd.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is gemarkeerd of de eigenaar deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Retourneert gestructureerde moderatiestatus.

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

- Eigenaars en moderators hebben toegang tot moderatiedetails voor verborgen Skills.
- Openbare callers krijgen alleen `200` voor al gemarkeerde zichtbare Skills.
- Bewijs wordt geredigeerd voor openbare callers en bevat alleen ruwe snippets voor eigenaars/moderators.

### `POST /api/v1/skills/{slug}/report`

Rapporteer een Skill voor moderatorbeoordeling. Rapporten zijn op Skill-niveau, optioneel gekoppeld
aan een versie, en voeden de Skill-rapportwachtrij.

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

Moderator-/admin-eindpunt voor intake van Skill-rapporten.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): pagineringscursor

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

Moderator-/admin-eindpunt voor het oplossen of heropenen van Skill-rapporten.

Verzoek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` terug op `open` wordt gezet. Geef `finalAction: "hide"` door met een getriageerd
rapport om de Skill in dezelfde controleerbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): pagineringscursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata + bestandenlijst.

- `version.security` bevat genormaliseerde scanverificatiestatus en scannerdetails
  (VirusTotal + LLM), wanneer beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert beveiligingsscanverificatiedetails voor een Skill-versie.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scannerspecifieke details.
- `security.capabilityTags` bevat deterministische capability-/risicolabels zoals
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` en `posts-externally` wanneer gedetecteerd.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel produceerde (`clean`, `suspicious` of `malicious`).
- `moderation` is een huidige moderatiesnapshot op Skill-niveau, afgeleid van de nieuwste versie.
- Wanneer je een historische versie opvraagt, controleer dan `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext behandelt.

### `GET /api/v1/skills/{slug}/file`

Retourneert ruwe tekstinhoud.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard naar nieuwste versie.
- Bestandsgroottelimiet: 200KB.

### `GET /api/v1/packages`

Uniform cataloguseindpunt voor:

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
- `capabilityTag` (optioneel): capaciteitsfilter voor pluginpakketten
- `target` / `hostTarget` (optioneel): verkorte schrijfwijze voor `host:<target>`
- `os`, `arch`, `libc` (optioneel): verkorte schrijfwijze voor hostcapaciteitsfilters
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optioneel): `true`/`1` als verkorte schrijfwijze voor omgevingsvereistetags
- `externalService`, `binary`, `osPermission` (optioneel): verkorte schrijfwijze voor benoemde
  omgevingsvereistetags
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om ClawPack-ondersteunde pakketversies weer te geven
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven vaste aliassen per familie.
- Skill-vermeldingen blijven ondersteund door het Skill-register en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds alleen voor releases van code-plugins en bundle-plugins.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen privé-pakketten zien voor uitgevers waartoe ze behoren in lijst-/zoekresultaten.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Geünificeerde cataloguszoekopdracht over Skills + pluginpakketten.

Queryparameters:

- `q` (verplicht): zoekreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `executesCode` (optioneel): `true` of `false`
- `capabilityTag` (optioneel): capaciteitsfilter voor pluginpakketten
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` en
  `osPermission` worden geaccepteerd als verkorte schrijfwijzen voor veelgebruikte capaciteitstags
- `artifactKind` (optioneel): `legacy-zip` of `npm-pack`
- `npmMirror` (optioneel): `true`/`1` om te zoeken naar ClawPack-ondersteunde pakketversies
  die beschikbaar zijn via de npm-mirror

Opmerkingen:

- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen zoeken in privé-pakketten voor uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper kan lezen.
- Artefactfilters worden ondersteund door geïndexeerde capaciteitstags:
  `artifact:legacy-zip`, `artifact:npm-pack` en `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retourneert metadata met pakketdetails.

Opmerkingen:

- Skills kunnen ook via deze route in de geünificeerde catalogus worden opgelost.
- Privé-pakketten retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases zacht.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van een organisatie-uitgever,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert de versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor

Opmerkingen:

- Privé-pakketten retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
capaciteiten, verificatie, artefactmetadata en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor pakketarchieven uit de oude wereld of
  `npm-pack` voor ClawPack-ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden opgenomen wanneer scangegevens bestaan.
- Privé-pakketten retourneren `404` tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete metadata van de artefactresolver voor een pakketversie.

Opmerkingen:

- Legacy-pakketversies retourneren een `legacy-zip`-artefact en een legacy ZIP
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de legacy ZIP-compatibiliteits-URL.
- Dit is het resolveroppervlak van OpenClaw; het voorkomt raden naar de archiefindeling op basis van
  een gedeelde URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen exact de geüploade npm-pack `.tgz`-bytes.
- Legacy ZIP-versies leiden om naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadsnelheidsbucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstig OpenClaw-gebruik.

Gereedheidscontroles omvatten:

- status van officieel kanaal
- beschikbaarheid van nieuwste versie
- beschikbaarheid van ClawPack npm-pack-artefact
- artefactdigest
- herkomst van bronrepo en commit
- OpenClaw-compatibiliteitsmetadata
- hostdoelen
- scanstatus

Antwoord:

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

Moderatoreindpunt voor het weergeven van officiële OpenClaw-pluginmigratierijen.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdergebruiker.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Antwoord:

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

Beheerdereindpunt voor het maken of bijwerken van een officiële pluginmigratierij.

Authenticatie:

- Vereist een API-token voor een beheerdersgebruiker.

Aanvraagbody:

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

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdergebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Betekenissen van statussen:

- `open`: verdachte, kwaadaardige, in behandeling zijnde, in quarantaine geplaatste, ingetrokken of gerapporteerde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of kwaadaardige releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketrapport.

Antwoord:

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

Rapporteer een pakket voor moderatorbeoordeling. Rapporten zijn op pakketniveau en optioneel
gekoppeld aan een versie. Ze voeden de moderatiewachtrij, maar verbergen niet automatisch en
blokkeren zelf geen downloads; moderators moeten releasemoderatie gebruiken om
artefacten goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Aanvraag:

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

Moderator-/beheerdereindpunt voor de intake van pakketrapporten.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdergebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

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

Eigenaar-/moderatoreindpunt voor zichtbaarheid van pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, uitgeverslid, moderator of
  beheerdergebruiker.

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

Moderator-/beheerdereindpunt voor het oplossen of heropenen van pakketrapporten.

Aanvraag:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` terug op `open` wordt gezet. Geef `finalAction: "quarantine"` of
`finalAction: "revoke"` door met een bevestigd rapport om releasemoderatie toe te passen in dezelfde controleerbare workflow.

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

Moderator-/beheerderseindpunt voor beoordeling van pakketreleases.

Verzoek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van opvolging.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases geven `403` terug vanuit routes voor artifactdownloads.
Elke wijziging schrijft een vermelding naar het auditlogboek.

### `POST /api/v1/packages/backfill/artifacts`

Alleen-voor-beheerders onderhoudseindpunt voor het labelen van oudere pakketreleases met
expliciete metadata voor het artifacttype.

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

- Standaard ingesteld op proefuitvoering.
- Releases zonder ClawPack-opslag krijgen het label `legacy-zip`.
- Bestaande door ClawPack ondersteunde rijen zonder `artifactKind` worden hersteld als
  `npm-pack`.
- Dit genereert geen ClawPacks en wijzigt geen artifactbytes.

### `GET /api/v1/packages/{name}/file`

Geeft ruwe tekstinhoud terug voor een pakketbestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de leeslimietbucket, niet de downloadbucket.
- Binaire bestanden geven `415` terug.
- Limiet voor bestandsgrootte: 200 KB.
- Lopende VirusTotal-scans blokkeren leesacties niet; schadelijke releases kunnen elders alsnog worden achtergehouden.
- Privépakketten geven `404` terug tenzij de aanroeper de eigenaarspublisher kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills verwijzen door naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zipbestanden met een `package/`-root zodat oude OpenClaw-
  clients blijven werken.
- Deze route blijft alleen ZIP. Deze streamt geen ClawPack-`.tgz`-bestanden.
- Antwoorden bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en
  `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door de resolver.
- Metadata die alleen in het register staat, wordt niet in het gedownloade archief geïnjecteerd.
- Lopende VirusTotal-scans blokkeren downloads niet; schadelijke releases geven `403` terug.
- Privépakketten geven `404` terug tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Geeft een npm-compatibele packument terug voor door ClawPack ondersteunde pakketversies.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Verouderde versies met alleen ZIP worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden zodat gebruikers npm naar de mirror kunnen laten wijzen als ze daarvoor kiezen.
- Packuments voor scoped packages ondersteunen zowel `/api/npm/@scope/name` als npm's
  gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exacte geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadlimietbucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm-integriteits-/shasum-metadata.
- Moderatie- en toegangscontroles voor privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Wordt door de CLI gebruikt om een lokale fingerprint aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): 64-tekens hex sha256 van de bundelfingerprint

Antwoord:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een zip van een skillversie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-tekenreeks
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Zacht verwijderde versies geven `410` terug.
- Downloadstatistieken worden geteld als unieke identiteiten per uur (`userId` wanneer het API-token geldig is, anders IP).

## Authenticatie-eindpunten (Bearer-token)

Alle eindpunten vereisen:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valideert het token en geeft de gebruikershandle terug.

### `POST /api/v1/skills`

Publiceert een nieuwe versie.

- Voorkeur: `multipart/form-data` met `payload`-JSON + `files[]`-blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Wanneer aanwezig, lost de API die
  publisher server-side op en vereist dat de actor publishertoegang heeft.
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, kan een
  bestaande skill naar die eigenaar worden verplaatst als de actor beheerder/eigenaar is bij zowel
  de huidige als de doelpublisher. Zonder deze opt-in worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist authenticatie met Bearer-token.
- Voorkeur: `multipart/form-data` met `payload`-JSON + `files[]`-blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Wanneer aanwezig, mogen alleen beheerders namens die eigenaar publiceren.

Validatiepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack-`.tgz`-uploads moeten
  dit bevatten op `package/openclaw.plugin.json`.
- Code-Plugins vereisen `package.json`, metadata van de bronrepository, metadata van de broncommit,
  metadata van het configschema, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen vertrouwde publishers mogen naar het `official`-kanaal publiceren.
- Publicaties namens iemand anders valideren nog steeds geschiktheid voor het officiële kanaal tegen het doel-eigenaarsaccount.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Zacht verwijderen / herstellen van een skill (eigenaar, moderator of beheerder).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wanneer aanwezig, wordt `reason` opgeslagen als de moderatieopmerking voor de skill en gekopieerd naar het auditlogboek.
Door de eigenaar gestarte zachte verwijderingen reserveren de slug 30 dagen; daarna kan de slug worden geclaimd door
een andere publisher. Het verwijderantwoord bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Moderator-/beheerderverbergacties en beveiligingsverwijderingen verlopen niet op deze manier.

Verwijderantwoord:

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

Alleen voor beheerders. Zorgt dat er een organisatiepublisher bestaat voor een handle. Als de handle nog verwijst naar een
verouderde gedeelde gebruikers-/persoonlijke publisher, migreert het eindpunt deze eerst naar een organisatiepublisher.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Antwoord: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Alleen voor beheerders. Reserveert rootslugs en pakketnamen voor een rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden privé-plaatsaanduidingspakketten zonder releaserijen, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release naar die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwoord: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Eindpunten voor beheer van eigenaarsslugs

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwoord: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwoord: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide eindpunten vereisen authenticatie met API-token en werken alleen voor de skill-eigenaar.
- `rename` bewaart de vorige slug als een redirectalias.
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

Bant een gebruiker en verwijdert eigen Skills definitief (alleen moderator/beheerder).

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

Maakt de ban van een gebruiker ongedaan en herstelt in aanmerking komende Skills (alleen beheerder).

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

Wijzigt een gebruikersrol (alleen beheerder).

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

Geeft gebruikers weer of zoekt gebruikers (alleen beheerder).

Queryparameters:

- `q` (optioneel): zoekopdracht
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximaal aantal resultaten (standaard 20, max. 200)

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

Voegt een ster toe of verwijdert deze (highlights). Beide eindpunten zijn idempotent.

Antwoorden:

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

Zie `DEPRECATIONS.md` voor het verwijderplan.

## Registerdetectie (`/.well-known/clawhub.json`)

De CLI kan register-/authenticatie-instellingen via de site ontdekken:

- `/.well-known/clawhub.json` (JSON, aanbevolen)
- `/.well-known/clawdhub.json` (verouderd)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, serveer dan dit bestand (of stel `CLAWHUB_REGISTRY` expliciet in; verouderd `CLAWDHUB_REGISTRY`).
