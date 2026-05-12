---
read_when:
    - Endpunkte hinzufügen/ändern
    - Fehlerbehebung für CLI-↔-Registry-Anfragen
summary: HTTP-API-Referenz (öffentliche Endpunkte + CLI-Endpunkte + Authentifizierung).
x-i18n:
    generated_at: "2026-05-12T23:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Basis-URL: `https://clawhub.ai` (Standard).

Alle v1-Pfade befinden sich unter `/api/v1/...`.
Legacy-`/api/...` und `/api/cli/...` bleiben aus Kompatibilitätsgründen erhalten (siehe `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Wiederverwendung des öffentlichen Katalogs

Verzeichnisse von Drittanbietern dürfen die öffentlichen Lese-Endpunkte verwenden, um ClawHub Skills aufzulisten oder zu durchsuchen. Bitte cachen Sie Ergebnisse, beachten Sie `429`/`Retry-After`, verlinken Sie Nutzer zurück zum kanonischen ClawHub-Eintrag (`https://clawhub.ai/<owner>/<slug>`) und vermeiden Sie den Eindruck, ClawHub empfehle die Drittanbieter-Website. Versuchen Sie nicht, versteckte, private oder durch Moderation blockierte Inhalte außerhalb der öffentlichen API-Oberfläche zu spiegeln.

Web-Slug-Kurzformen werden über Registry-Familien hinweg aufgelöst, aber API-Clients sollten die von Lese-Endpunkten zurückgegebenen kanonischen URLs verwenden, statt die Routenpriorität zu rekonstruieren.

## Rate Limits

Durchsetzungsmodell:

- Anonyme Anfragen: pro IP durchgesetzt.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Nutzer-Bucket durchgesetzt.
- Wenn das Token fehlt/ungültig ist, fällt das Verhalten auf IP-Durchsetzung zurück.
- Authentifizierte Schreib-Endpunkte sollten kein bloßes `Unauthorized` zurückgeben, wenn
  der Server den Grund kennt. Fehlende Tokens, ungültige/widerrufene Tokens und
  gelöschte/gesperrte/deaktivierte Konten sollten jeweils handlungsorientierten Text erhalten, damit CLI-
  Clients Nutzern mitteilen können, was sie blockiert hat.

- Lesen: 600/min pro IP, 2400/min pro Schlüssel
- Schreiben: 45/min pro IP, 180/min pro Schlüssel
- Download: 30/min pro IP, 180/min pro Schlüssel (`/api/v1/download`)

Header:

- Legacy-Kompatibilität: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standardisiert: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bei `429`: `Retry-After`

Header-Semantik:

- `X-RateLimit-Reset`: absolute Unix-Epoch-Sekunden
- `RateLimit-Reset`: Sekunden bis zum Zurücksetzen (Verzögerung)
- `Retry-After`: Sekunden Wartezeit vor erneutem Versuch (Verzögerung) bei `429`

Beispielantwort `429`:

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

Client-Anleitung:

- Wenn `Retry-After` vorhanden ist, warten Sie so viele Sekunden vor einem erneuten Versuch.
- Verwenden Sie Backoff mit Jitter, um synchronisierte erneute Versuche zu vermeiden.
- Wenn `Retry-After` fehlt, fallen Sie auf `RateLimit-Reset` zurück (oder berechnen Sie aus `X-RateLimit-Reset`).

IP-Quelle:

- Verwendet standardmäßig `cf-connecting-ip` (Cloudflare) für die Client-IP.
- ClawHub verwendet vertrauenswürdige Weiterleitungs-Header, um Client-IPs am Edge zu identifizieren.
- Wenn keine vertrauenswürdige Client-IP verfügbar ist, verwenden anonyme Download-Anfragen einen Endpunkt-spezifischen Fallback-Bucket statt eines globalen `ip:unknown`-Buckets. Anonyme Lese-/Schreibanfragen verwenden weiterhin den gemeinsamen Unbekannt-Bucket, damit Routing mit fehlender IP sichtbar und konservativ bleibt.

## Öffentliche Endpunkte (keine Authentifizierung)

### `GET /api/v1/search`

Query-Parameter:

- `q` (erforderlich): Suchzeichenfolge
- `limit` (optional): Ganzzahl
- `highlightedOnly` (optional): `true`, um auf hervorgehobene Skills zu filtern
- `nonSuspiciousOnly` (optional): `true`, um verdächtige (`flagged.suspicious`) Skills auszublenden
- `nonSuspicious` (optional): Legacy-Alias für `nonSuspiciousOnly`

Antwort:

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

Hinweise:

- Ergebnisse werden in Relevanzreihenfolge zurückgegeben (Embedding-Ähnlichkeit + exakte Slug-/Namens-Token-Boosts + Popularitätsprior aus Downloads).
- Relevanz ist stärker als Popularität. Eine präzise Übereinstimmung mit einem Slug- oder Anzeigenamen-Token kann eine lockerere Übereinstimmung mit deutlich mehr Downloads übertreffen.
- ASCII-Text wird an Wort- und Interpunktionsgrenzen tokenisiert. Zum Beispiel enthält `personal-map` ein eigenständiges `map`-Token, während `amap-jsapi-skill` `amap`, `jsapi` und `skill` enthält; die Suche nach `map` gibt `personal-map` daher eine stärkere lexikalische Übereinstimmung als `amap-jsapi-skill`.
- Downloads werden als kleiner logarithmisch skalierter Prior und Tie-Breaker verwendet, nicht als primäres Ranking-Signal. Skills mit vielen Downloads können niedriger ranken, wenn der Suchtext eine schwächere Übereinstimmung ist.
- Verdächtiger oder versteckter Moderationsstatus kann einen Skill je nach Caller-Filtern und aktuellem Moderationsstatus aus der öffentlichen Suche entfernen.

Anleitung zur Auffindbarkeit für Publisher:

- Platzieren Sie die Begriffe, nach denen Nutzer wörtlich suchen werden, im Anzeigenamen, in der Zusammenfassung und in Tags. Verwenden Sie ein eigenständiges Slug-Token nur, wenn es auch eine stabile Identität ist, die Sie beibehalten möchten.
- Benennen Sie einen Slug nicht nur um, um eine einzelne Suchanfrage zu bedienen, außer der neue Slug ist ein besserer langfristiger kanonischer Name. Alte Slugs werden zu Weiterleitungsaliasen, aber die kanonische URL, der angezeigte Slug und zukünftige Such-Digests verwenden den neuen Slug.
- Umbenennungsaliase erhalten die Auflösung für alte URLs und Installationen, die über die Registry auflösen, aber das Suchranking basiert auf den kanonischen Skill-Metadaten, nachdem die Umbenennung indexiert wurde. Vorhandene Statistiken bleiben beim Skill.
- Wenn ein Skill unerwartet unsichtbar ist, prüfen Sie zuerst den Moderationsstatus mit `clawhub inspect <slug>`, während Sie angemeldet sind, bevor Sie rankingbezogene Metadaten ändern.

### `GET /api/v1/skills`

Query-Parameter:

- `limit` (optional): Ganzzahl (1–200)
- `cursor` (optional): Paginierungs-Cursor für jede Nicht-`trending`-Sortierung
- `sort` (optional): `updated` (Standard), `createdAt` (Alias: `newest`), `downloads`, `stars` (Alias: `rating`), `installsCurrent` (Alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (optional): `true`, um verdächtige (`flagged.suspicious`) Skills auszublenden
- `nonSuspicious` (optional): Legacy-Alias für `nonSuspiciousOnly`

Hinweise:

- `trending` rankt nach Installationen in den letzten 7 Tagen (telemetriebasiert).
- `createdAt` ist stabil für Crawls neuer Skills; `updated` ändert sich, wenn vorhandene Skills erneut veröffentlicht werden.
- Wenn `nonSuspiciousOnly=true`, können cursorbasierte Sortierungen auf einer Seite weniger als `limit` Elemente zurückgeben, weil verdächtige Skills nach dem Abruf der Seite gefiltert werden.
- Verwenden Sie `nextCursor`, um die Paginierung fortzusetzen, wenn vorhanden. Eine kurze Seite bedeutet für sich genommen nicht das Ende der Ergebnisse.

Antwort:

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

Antwort:

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

Hinweise:

- Alte Slugs, die durch Owner-Umbenennungs-/Merge-Flows erstellt wurden, lösen zum kanonischen Skill auf.
- `metadata.os`: OS-Einschränkungen, die im Skill-Frontmatter deklariert sind (z. B. `["macos"]`, `["linux"]`). `null`, wenn nicht deklariert.
- `metadata.systems`: Nix-Systemziele (z. B. `["aarch64-darwin", "x86_64-linux"]`). `null`, wenn nicht deklariert.
- `metadata` ist `null`, wenn der Skill keine Plattform-Metadaten hat.
- `moderation` wird nur eingeschlossen, wenn der Skill markiert ist oder der Owner ihn ansieht.

### `GET /api/v1/skills/{slug}/moderation`

Gibt strukturierten Moderationsstatus zurück.

Antwort:

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

Hinweise:

- Owner und Moderatoren können auf Moderationsdetails für versteckte Skills zugreifen.
- Öffentliche Caller erhalten nur für bereits markierte sichtbare Skills `200`.
- Belege werden für öffentliche Caller redigiert und enthalten rohe Ausschnitte nur für Owner/Moderatoren.

### `POST /api/v1/skills/{slug}/report`

Einen Skill zur Überprüfung durch Moderatoren melden. Meldungen gelten auf Skill-Ebene, sind optional mit einer Version verknüpft und speisen die Skill-Meldewarteschlange.

Auth:

- Erfordert ein API-Token.

Anfrage:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Antwort:

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

Moderator-/Admin-Endpunkt für Skill-Meldungseingang.

Query-Parameter:

- `status` (optional): `open` (Standard), `confirmed`, `dismissed` oder `all`
- `limit` (optional): Ganzzahl (1-200)
- `cursor` (optional): Paginierungs-Cursor

Antwort:

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

Moderator-/Admin-Endpunkt zum Auflösen oder Wiederöffnen von Skill-Meldungen.

Anfrage:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` ist für `confirmed` und `dismissed` erforderlich; es kann weggelassen werden, wenn
`status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "hide"` mit einer triagierten
Meldung, um den Skill im selben auditierbaren Workflow auszublenden.

### `GET /api/v1/skills/{slug}/versions`

Query-Parameter:

- `limit` (optional): Ganzzahl
- `cursor` (optional): Paginierungs-Cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Gibt Versionsmetadaten + Dateiliste zurück.

- `version.security` enthält normalisierten Scan-Verifizierungsstatus und Scanner-Details
  (VirusTotal + LLM), wenn verfügbar.

### `GET /api/v1/skills/{slug}/scan`

Gibt Details zur Sicherheits-Scan-Verifizierung für eine Skill-Version zurück.

Query-Parameter:

- `version` (optional): bestimmte Versionszeichenfolge.
- `tag` (optional): eine getaggte Version auflösen (zum Beispiel `latest`).

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Enthält normalisierten Verifizierungsstatus plus scanner-spezifische Details.
- `security.capabilityTags` enthält deterministische Capability-/Risikolabels wie
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` und `posts-externally`, wenn erkannt.
- `security.hasScanResult` ist nur dann `true`, wenn ein Scanner ein definitives Urteil (`clean`, `suspicious` oder `malicious`) erzeugt hat.
- `moderation` ist ein aktueller Moderations-Snapshot auf Skill-Ebene, abgeleitet von der neuesten Version.
- Wenn Sie eine historische Version abfragen, prüfen Sie `moderation.matchesRequestedVersion` und `moderation.sourceVersion`, bevor Sie `moderation` und `security` als denselben Versionskontext behandeln.

### `GET /api/v1/skills/{slug}/file`

Gibt rohen Textinhalt zurück.

Query-Parameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Standardmäßig wird die neueste Version verwendet.
- Dateigrößenlimit: 200KB.

### `GET /api/v1/packages`

Einheitlicher Katalog-Endpunkt für:

- Skills
- Code-Plugins
- Bundle-Plugins

Query-Parameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungs-Cursor
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `executesCode` (optional): `true` oder `false`
- `capabilityTag` (optional): Capability-Filter für Plugin-Pakete
- `target` / `hostTarget` (optional): Kurzform für `host:<target>`
- `os`, `arch`, `libc` (optional): Kurzform für Host-Capability-Filter
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optional): `true`/`1`-Kurzform für Tags zu Umgebungsanforderungen
- `externalService`, `binary`, `osPermission` (optional): Kurzform für benannte
  Tags zu Umgebungsanforderungen
- `artifactKind` (optional): `legacy-zip` oder `npm-pack`
- `npmMirror` (optional): `true`/`1`, um ClawPack-gestützte Paketversionen anzuzeigen,
  die über den npm-Mirror verfügbar sind

Hinweise:

- `GET /api/v1/code-plugins` und `GET /api/v1/bundle-plugins` bleiben Aliasse mit fester Familie.
- Skill-Einträge bleiben durch die Skill-Registry gestützt und können weiterhin nur über `POST /api/v1/skills` veröffentlicht werden.
- `POST /api/v1/packages` ist weiterhin nur für code-plugin- und bundle-plugin-Releases vorgesehen.
- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können private Pakete für Publisher, denen sie angehören, in Listen-/Suchergebnissen sehen.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.

### `GET /api/v1/packages/search`

Einheitliche Katalogsuche über Skills + Plugin-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl (1–100)
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `executesCode` (optional): `true` oder `false`
- `capabilityTag` (optional): Capability-Filter für Plugin-Pakete
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` und
  `osPermission` werden als Kurzformen für häufige Capability-Tags akzeptiert
- `artifactKind` (optional): `legacy-zip` oder `npm-pack`
- `npmMirror` (optional): `true`/`1`, um nach ClawPack-gestützten Paketversionen zu suchen,
  die über den npm-Mirror verfügbar sind

Hinweise:

- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können private Pakete für Publisher suchen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.
- Artefaktfilter werden durch indizierte Capability-Tags gestützt:
  `artifact:legacy-zip`, `artifact:npm-pack` und `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Gibt detaillierte Paketmetadaten zurück.

Hinweise:

- Skills können im einheitlichen Katalog ebenfalls über diese Route aufgelöst werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `DELETE /api/v1/packages/{name}`

Löscht ein Paket und alle Releases per Soft Delete.

Hinweise:

- Erfordert ein API-Token für den Paketeigentümer, einen Eigentümer/Admin des Org-Publishers,
  einen Plattformmoderator oder einen Plattformadmin.

### `GET /api/v1/packages/{name}/versions`

Gibt den Versionsverlauf zurück.

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungs-Cursor

Hinweise:

- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/versions/{version}`

Gibt eine Paketversion zurück, einschließlich Dateimetadaten, Kompatibilität,
Capabilities, Verifizierung, Artefaktmetadaten und Scan-Daten.

Hinweise:

- `version.artifact.kind` ist `legacy-zip` für alte Paketarchive oder
  `npm-pack` für ClawPack-gestützte Releases.
- ClawPack-Releases enthalten die npm-kompatiblen Felder `npmIntegrity`, `npmShasum` und
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` und `version.staticScan` sind enthalten, wenn Scan-Daten vorhanden sind.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Gibt die expliziten Artefakt-Resolver-Metadaten für eine Paketversion zurück.

Hinweise:

- Legacy-Paketversionen geben ein `legacy-zip`-Artefakt und eine Legacy-ZIP-
  `downloadUrl` zurück.
- ClawPack-Versionen geben ein `npm-pack`-Artefakt, npm-Integritätsfelder, eine
  `tarballUrl` und die Legacy-ZIP-Kompatibilitäts-URL zurück.
- Dies ist die OpenClaw-Resolver-Oberfläche; sie vermeidet, das Archivformat aus
  einer gemeinsam genutzten URL zu erraten.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Lädt das Versionsartefakt über den expliziten Resolver-Pfad herunter.

Hinweise:

- ClawPack-Versionen streamen exakt die hochgeladenen npm-pack-`.tgz`-Bytes.
- Legacy-ZIP-Versionen leiten zu `/api/v1/packages/{name}/download?version=` um.
- Verwendet den Download-Rate-Bucket.

### `GET /api/v1/packages/{name}/readiness`

Gibt die berechnete Bereitschaft für zukünftige OpenClaw-Nutzung zurück.

Bereitschaftsprüfungen umfassen:

- Status des offiziellen Kanals
- Verfügbarkeit der neuesten Version
- Verfügbarkeit des ClawPack-npm-pack-Artefakts
- Artefakt-Digest
- Quell-Repository und Commit-Provenienz
- OpenClaw-Kompatibilitätsmetadaten
- Host-Ziele
- Scan-Status

Antwort:

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

Moderator-Endpunkt zum Auflisten offizieller OpenClaw-Plugin-Migrationszeilen.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Abfrageparameter:

- `phase` (optional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` oder
  `all` (Standard).
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Antwort:

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

Admin-Endpunkt zum Erstellen oder Aktualisieren einer offiziellen Plugin-Migrationszeile.

Authentifizierung:

- Erfordert ein API-Token für einen Admin-Benutzer.

Anfragetext:

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

Hinweise:

- `bundledPluginId` wird in Kleinbuchstaben normalisiert und ist der stabile Upsert-Schlüssel.
- `packageName` wird als npm-Name normalisiert; das Paket kann bei geplanten
  Migrationen fehlen.
- Dies verfolgt nur die Migrationsbereitschaft. Es mutiert OpenClaw nicht und generiert
  keine ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/Admin-Endpunkt für Warteschlangen zur Paket-Release-Prüfung.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Abfrageparameter:

- `status` (optional): `open` (Standard), `blocked`, `manual` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Statusbedeutungen:

- `open`: verdächtige, bösartige, ausstehende, quarantänisierte, widerrufene oder gemeldete Releases.
- `blocked`: quarantänisierte, widerrufene oder bösartige Releases.
- `manual`: jedes Release mit einer manuellen Moderationsüberschreibung.
- `all`: jedes Release mit einer manuellen Überschreibung, einem nicht sauberen Scan-Status oder einer Paketmeldung.

Antwort:

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

Meldet ein Paket zur Prüfung durch Moderatoren. Meldungen gelten auf Paketebene und sind optional
mit einer Version verknüpft. Sie speisen die Moderationswarteschlange, blenden Downloads aber nicht
automatisch aus und blockieren sie nicht eigenständig; Moderatoren sollten Release-Moderation verwenden, um
Artefakte freizugeben, zu quarantänisieren oder zu widerrufen.

Authentifizierung:

- Erfordert ein API-Token.

Anfrage:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Antwort:

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

Moderator-/Admin-Endpunkt für den Eingang von Paketmeldungen.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Abfrageparameter:

- `status` (optional): `open` (Standard), `confirmed`, `dismissed` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Antwort:

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

Eigentümer-/Moderator-Endpunkt für Sichtbarkeit der Paketmoderation.

Authentifizierung:

- Erfordert ein API-Token für den Paketeigentümer, ein Publisher-Mitglied, einen Moderator oder
  einen Admin-Benutzer.

Antwort:

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

Moderator-/Admin-Endpunkt zum Auflösen oder erneuten Öffnen von Paketmeldungen.

Anfrage:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` ist für `confirmed` und `dismissed` erforderlich; es kann weggelassen werden, wenn
`status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "quarantine"` oder
`finalAction: "revoke"` mit einem bestätigten Bericht, um Release-Moderation im
gleichen auditierbaren Workflow anzuwenden.

Antwort:

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

Moderator-/Admin-Endpunkt für die Prüfung von Package-Releases.

Anfrage:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Unterstützte Zustände:

- `approved`: manuell geprüft und zugelassen.
- `quarantined`: blockiert bis zur Nachverfolgung.
- `revoked`: blockiert, nachdem ein Release zuvor als vertrauenswürdig galt.

Unter Quarantäne gestellte und widerrufene Releases geben bei Artifact-Download-Routen `403` zurück.
Jede Änderung schreibt einen Audit-Log-Eintrag.

### `POST /api/v1/packages/backfill/artifacts`

Nur für Admins vorgesehener Wartungsendpunkt zum Kennzeichnen älterer Package-Releases mit
expliziten Metadaten zur Artifact-Art.

Anfragetext:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Antwort:

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

Hinweise:

- Standardmäßig ein Probelauf.
- Releases ohne ClawPack-Speicher werden als `legacy-zip` gekennzeichnet.
- Vorhandene ClawPack-gestützte Zeilen, denen `artifactKind` fehlt, werden als
  `npm-pack` repariert.
- Dies erzeugt keine ClawPacks und verändert keine Artifact-Bytes.

### `GET /api/v1/packages/{name}/file`

Gibt rohen Textinhalt für eine Package-Datei zurück.

Query-Parameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig das neueste Release.
- Verwendet den Lese-Rate-Bucket, nicht den Download-Bucket.
- Binärdateien geben `415` zurück.
- Dateigrößenlimit: 200 KB.
- Ausstehende VirusTotal-Scans blockieren Lesezugriffe nicht; schädliche Releases können anderswo dennoch zurückgehalten werden.
- Private Packages geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/download`

Lädt das ältere deterministische ZIP-Archiv für ein Package-Release herunter.

Query-Parameter:

- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig das neueste Release.
- Skills leiten zu `GET /api/v1/download` weiter.
- Plugin-/Package-Archive sind ZIP-Dateien mit einer `package/`-Wurzel, damit alte OpenClaw-
  Clients weiter funktionieren.
- Diese Route bleibt ZIP-exklusiv. Sie streamt keine ClawPack-`.tgz`-Dateien.
- Antworten enthalten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- und
  `X-ClawHub-Artifact-Sha256`-Header für Integritätsprüfungen des Resolvers.
- Nur in der Registry vorhandene Metadaten werden nicht in das heruntergeladene Archiv eingefügt.
- Ausstehende VirusTotal-Scans blockieren Downloads nicht; schädliche Releases geben `403` zurück.
- Private Packages geben `404` zurück, sofern der Aufrufer nicht der Owner ist.

### `GET /api/npm/{package}`

Gibt ein npm-kompatibles Packument für ClawPack-gestützte Package-Versionen zurück.

Hinweise:

- Nur Versionen mit hochgeladenen ClawPack-`npm-pack`-Tarballs werden aufgelistet.
- Ältere reine ZIP-Versionen werden absichtlich ausgelassen.
- `dist.tarball`, `dist.integrity` und `dist.shasum` verwenden npm-kompatible
  Felder, damit Benutzer npm bei Bedarf auf den Mirror verweisen können.
- Scoped-Package-Packuments unterstützen sowohl `/api/npm/@scope/name` als auch den von npm
  kodierten Anfragepfad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt die exakt hochgeladenen ClawPack-Tarball-Bytes für npm-Mirror-Clients.

Hinweise:

- Verwendet den Download-Rate-Bucket.
- Download-Header enthalten ClawHub-SHA-256 sowie npm-Integritäts-/Shasum-Metadaten.
- Moderations- und Zugriffsprüfungen für private Packages gelten weiterhin.

### `GET /api/v1/resolve`

Wird von der CLI verwendet, um einen lokalen Fingerprint einer bekannten Version zuzuordnen.

Query-Parameter:

- `slug` (erforderlich)
- `hash` (erforderlich): 64-Zeichen-Hex-sha256 des Bundle-Fingerprints

Antwort:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Lädt eine ZIP-Datei einer Skill-Version herunter.

Query-Parameter:

- `slug` (erforderlich)
- `version` (optional): Semver-Zeichenfolge
- `tag` (optional): Tag-Name (z. B. `latest`)

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Per Soft Delete gelöschte Versionen geben `410` zurück.
- Download-Statistiken werden als eindeutige Identitäten pro Stunde gezählt (`userId`, wenn das API-Token gültig ist, andernfalls IP).

## Auth-Endpunkte (Bearer-Token)

Alle Endpunkte erfordern:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Validiert das Token und gibt den Benutzer-Handle zurück.

### `POST /api/v1/skills`

Veröffentlicht eine neue Version.

- Bevorzugt: `multipart/form-data` mit `payload`-JSON + `files[]`-Blobs.
- JSON-Body mit `files` (storageId-basiert) wird ebenfalls akzeptiert.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, löst die API diesen
  Publisher serverseitig auf und verlangt, dass der Akteur Publisher-Zugriff hat.
- Optionales Payload-Feld: `migrateOwner`. Wenn `true` zusammen mit `ownerHandle`, kann ein
  vorhandener Skill zu diesem Owner verschoben werden, sofern der Akteur Admin/Owner sowohl beim
  aktuellen als auch beim Ziel-Publisher ist. Ohne dieses Opt-in werden Owner-Änderungen
  abgelehnt.

### `POST /api/v1/packages`

Veröffentlicht ein Code-Plugin- oder Bundle-Plugin-Release.

- Erfordert Authentifizierung mit Bearer-Token.
- Bevorzugt: `multipart/form-data` mit `payload`-JSON + `files[]`-Blobs.
- JSON-Body mit `files` (storageId-basiert) wird ebenfalls akzeptiert.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, dürfen nur Admins im Namen dieses Owners veröffentlichen.

Validierungsschwerpunkte:

- `family` muss `code-plugin` oder `bundle-plugin` sein.
- Plugin-Packages erfordern `openclaw.plugin.json`. ClawPack-`.tgz`-Uploads müssen
  es unter `package/openclaw.plugin.json` enthalten.
- Code-Plugins erfordern `package.json`, Quell-Repo-Metadaten, Quell-Commit-
  Metadaten, Konfigurationsschema-Metadaten, `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
- Nur vertrauenswürdige Publisher dürfen im `official`-Kanal veröffentlichen.
- Veröffentlichungen im Auftrag anderer validieren die Berechtigung für den offiziellen Kanal weiterhin gegen das Ziel-Owner-Konto.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skill per Soft Delete löschen / wiederherstellen (Owner, Moderator oder Admin).

Optionaler JSON-Body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wenn vorhanden, wird `reason` als Skill-Moderationsnotiz gespeichert und in das Audit-Log kopiert.
Vom Owner initiierte Soft Deletes reservieren den Slug für 30 Tage, danach kann der Slug von
einem anderen Publisher beansprucht werden. Die Löschantwort enthält `slugReservedUntil`, wenn dieser Ablauf gilt.
Ausblendungen durch Moderatoren/Admins und Sicherheitsentfernungen laufen auf diese Weise nicht ab.

Löschantwort:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: OK
- `401`: nicht autorisiert
- `403`: verboten
- `404`: Skill/Benutzer nicht gefunden
- `500`: interner Serverfehler

### `POST /api/v1/users/publisher`

Nur für Admins. Stellt sicher, dass ein Org-Publisher für einen Handle existiert. Wenn der Handle noch auf einen
älteren gemeinsamen Benutzer-/persönlichen Publisher zeigt, migriert der Endpunkt ihn zuerst in einen Org-Publisher.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Nur für Admins. Reserviert Root-Slugs und Package-Namen für einen rechtmäßigen Owner, ohne ein
Release zu veröffentlichen. Package-Namen werden zu privaten Platzhalter-Packages ohne Release-Zeilen, sodass derselbe
Owner später das echte Code-Plugin- oder Bundle-Plugin-Release unter diesem Namen veröffentlichen kann.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwort: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpunkte zur Owner-Slug-Verwaltung

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwort: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwort: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Hinweise:

- Beide Endpunkte erfordern Authentifizierung per API-Token und funktionieren nur für den Skill-Owner.
- `rename` bewahrt den vorherigen Slug als Weiterleitungsalias auf.
- `merge` blendet den Quelleintrag aus und leitet den Quell-Slug zum Zieleintrag weiter.

### Endpunkte zum Übertragen der Ownership

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Antwort: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Antwort (annehmen/ablehnen/abbrechen): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Antwortformat: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Sperrt einen Benutzer und löscht eigene Skills dauerhaft (nur Moderator/Admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

oder

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Antwort:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Hebt die Sperre eines Benutzers auf und stellt berechtigte Skills wieder her (nur Admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

oder

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Antwort:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

Ändert eine Benutzerrolle (nur Admin).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

oder

```json
{ "userId": "users_...", "role": "admin" }
```

Antwort:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Benutzer auflisten oder suchen (nur Admin).

Query-Parameter:

- `q` (optional): Suchanfrage
- `query` (optional): Alias für `q`
- `limit` (optional): maximale Ergebnisse (Standard 20, maximal 200)

Antwort:

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

Einen Star hinzufügen/entfernen (Highlights). Beide Endpunkte sind idempotent.

Antworten:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Ältere CLI-Endpunkte (veraltet)

Für ältere CLI-Versionen weiterhin unterstützt:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Siehe `DEPRECATIONS.md` für den Entfernungsplan.

## Registry-Erkennung (`/.well-known/clawhub.json`)

Die CLI kann Registry-/Auth-Einstellungen von der Website ermitteln:

- `/.well-known/clawhub.json` (JSON, bevorzugt)
- `/.well-known/clawdhub.json` (alt)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Wenn Sie selbst hosten, stellen Sie diese Datei bereit (oder setzen Sie `CLAWHUB_REGISTRY` explizit; älteres `CLAWDHUB_REGISTRY`).
