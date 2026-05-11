---
read_when:
    - Hinzufügen/Ändern von Endpunkten
    - Fehlerbehebung für CLI-↔-Registry-Anfragen
summary: HTTP-API-Referenz (öffentlich + CLI-Endpunkte + Authentifizierung).
x-i18n:
    generated_at: "2026-05-11T20:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (Standard).

Alle v1-Pfade liegen unter `/api/v1/...`.
Legacy-`/api/...` und `/api/cli/...` bleiben aus Kompatibilitätsgründen erhalten (siehe `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Wiederverwendung des öffentlichen Katalogs

Drittanbieter-Verzeichnisse dürfen die öffentlichen Lese-Endpunkte verwenden, um ClawHub-Skills aufzulisten oder zu durchsuchen. Cachen Sie Ergebnisse, beachten Sie `429`/`Retry-After`, verlinken Sie Benutzer zurück zum kanonischen ClawHub-Eintrag (`https://clawhub.ai/<owner>/<slug>`), und vermeiden Sie den Eindruck, ClawHub unterstütze die Drittanbieter-Website. Versuchen Sie nicht, ausgeblendete, private oder durch Moderation blockierte Inhalte außerhalb der öffentlichen API-Oberfläche zu spiegeln.

Web-Slug-Kurzformen werden über Registry-Familien hinweg aufgelöst, API-Clients sollten jedoch die von Lese-Endpunkten zurückgegebenen kanonischen URLs verwenden, statt die Routenpriorität zu rekonstruieren.

## Rate-Limits

Durchsetzungsmodell:

- Anonyme Anfragen: pro IP durchgesetzt.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Benutzer-Bucket durchgesetzt.
- Wenn das Token fehlt/ungültig ist, fällt das Verhalten auf IP-Durchsetzung zurück.
- Authentifizierte Schreib-Endpunkte sollten kein bloßes `Unauthorized` zurückgeben, wenn
  der Server den Grund kennt. Fehlende Tokens, ungültige/widerrufene Tokens und
  gelöschte/gesperrte/deaktivierte Konten sollten jeweils handlungsorientierten Text erhalten, damit CLI-
  Clients Benutzern mitteilen können, was sie blockiert hat.

- Lesen: 600/min pro IP, 2400/min pro Schlüssel
- Schreiben: 45/min pro IP, 180/min pro Schlüssel
- Download: 30/min pro IP, 180/min pro Schlüssel (`/api/v1/download`)

Header:

- Legacy-Kompatibilität: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standardisiert: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Bei `429`: `Retry-After`

Header-Semantik:

- `X-RateLimit-Reset`: absolute Unix-Epochenzeit in Sekunden
- `RateLimit-Reset`: Sekunden bis zum Zurücksetzen (Verzögerung)
- `Retry-After`: Sekunden, die vor einem erneuten Versuch gewartet werden sollen (Verzögerung), bei `429`

Beispiel für eine `429`-Antwort:

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

Client-Leitlinien:

- Wenn `Retry-After` vorhanden ist, warten Sie so viele Sekunden vor dem erneuten Versuch.
- Verwenden Sie Backoff mit Jitter, um synchronisierte Wiederholungsversuche zu vermeiden.
- Wenn `Retry-After` fehlt, fallen Sie auf `RateLimit-Reset` zurück (oder berechnen Sie aus `X-RateLimit-Reset`).

IP-Quelle:

- Verwendet standardmäßig `cf-connecting-ip` (Cloudflare) für die Client-IP.
- ClawHub verwendet vertrauenswürdige Forwarding-Header, um Client-IPs am Edge zu identifizieren.
- Wenn keine vertrauenswürdige Client-IP verfügbar ist, verwenden anonyme Download-Anfragen einen endpunktspezifischen Fallback-Bucket statt eines globalen `ip:unknown`-Buckets. Anonyme Lese-/Schreibanfragen verwenden weiterhin den gemeinsamen Unknown-Bucket, damit Routing mit fehlender IP sichtbar und konservativ bleibt.

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
- Relevanz ist stärker als Popularität. Ein präziser Slug- oder Anzeigenamen-Token-Treffer kann einen unschärferen Treffer mit deutlich mehr Downloads übertreffen.
- ASCII-Text wird an Wort- und Interpunktionsgrenzen tokenisiert. Beispielsweise enthält `personal-map` ein eigenständiges `map`-Token, während `amap-jsapi-skill` `amap`, `jsapi` und `skill` enthält; eine Suche nach `map` gibt `personal-map` daher einen stärkeren lexikalischen Treffer als `amap-jsapi-skill`.
- Downloads werden als kleiner logarithmisch skalierter Prior und Tie-Breaker verwendet, nicht als primäres Ranking-Signal. Skills mit vielen Downloads können niedriger ranken, wenn der Suchtext schwächer passt.
- Verdächtiger oder ausgeblendeter Moderationsstatus kann je nach Caller-Filtern und aktuellem Moderationsstatus einen Skill aus der öffentlichen Suche entfernen.

Leitlinien zur Auffindbarkeit für Publisher:

- Nehmen Sie die Begriffe, nach denen Benutzer tatsächlich suchen werden, in Anzeigenamen, Zusammenfassung und Tags auf. Verwenden Sie ein eigenständiges Slug-Token nur, wenn es auch eine stabile Identität ist, die Sie beibehalten möchten.
- Benennen Sie einen Slug nicht nur um, um eine einzelne Suchanfrage zu bedienen, es sei denn, der neue Slug ist ein besserer langfristiger kanonischer Name. Alte Slugs werden zu Weiterleitungsaliasen, aber die kanonische URL, der angezeigte Slug und zukünftige Such-Digests verwenden den neuen Slug.
- Umbenennungsaliasen erhalten die Auflösung für alte URLs und Installationen, die über die Registry aufgelöst werden, aber das Suchranking basiert nach der Indexierung der Umbenennung auf den kanonischen Skill-Metadaten. Bestehende Statistiken bleiben beim Skill.
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
- `createdAt` ist stabil für Crawls neuer Skills; `updated` ändert sich, wenn bestehende Skills erneut veröffentlicht werden.
- Wenn `nonSuspiciousOnly=true`, können Cursor-basierte Sortierungen auf einer Seite weniger als `limit` Elemente zurückgeben, weil verdächtige Skills nach dem Abruf der Seite gefiltert werden.
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

- Alte Slugs, die durch Owner-Umbenennungs-/Merge-Flows entstanden sind, werden auf den kanonischen Skill aufgelöst.
- `metadata.os`: OS-Einschränkungen, die im Skill-Frontmatter deklariert sind (z. B. `["macos"]`, `["linux"]`). `null`, wenn nicht deklariert.
- `metadata.systems`: Nix-Systemziele (z. B. `["aarch64-darwin", "x86_64-linux"]`). `null`, wenn nicht deklariert.
- `metadata` ist `null`, wenn der Skill keine Plattformmetadaten hat.
- `moderation` ist nur enthalten, wenn der Skill markiert ist oder der Owner ihn anzeigt.

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

- Owner und Moderatoren können auf Moderationsdetails für ausgeblendete Skills zugreifen.
- Öffentliche Caller erhalten `200` nur für bereits markierte sichtbare Skills.
- Nachweise werden für öffentliche Caller redigiert und enthalten Roh-Snippets nur für Owner/Moderatoren.

### `POST /api/v1/skills/{slug}/report`

Melden Sie einen Skill zur Prüfung durch Moderatoren. Meldungen gelten auf Skill-Ebene, sind optional mit einer Version verknüpft und fließen in die Skill-Meldewarteschlange ein.

Authentifizierung:

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

### `POST /api/v1/skills/{slug}/appeal`

Skill-Owner-/Publisher-Endpunkt zum Anfechten einer Moderation eines Skills.

Authentifizierung:

- Erfordert ein API-Token für den Skill-Owner oder ein Publisher-Mitglied.

Anfrage:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Einsprüche werden für ausgeblendete, entfernte, verdächtige, schädliche oder vom Scanner markierte Skill-Ergebnisse akzeptiert. ClawHub hält einen offenen Einspruch pro Skill vor.

Antwort:

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

Fordert einen Sicherheits-Rescan für die zuletzt veröffentlichte Skill-Version an.

Authentifizierung:

- Erfordert ein API-Token für den Skill-Owner, Publisher-Admin, Plattform-
  Moderator oder Plattform-Admin.
- Owner und Publisher-Admins unterliegen dem Recovery-Limit pro Version für Owner.
  Plattform-Moderatoren und Admins nicht, aber ClawHub erlaubt dennoch nur
  einen aktiven Rescan pro Version.

Antwort:

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

Moderator-/Admin-Endpunkt für die Aufnahme von Skill-Meldungen.

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

`note` ist für `confirmed` und `dismissed` erforderlich; sie kann ausgelassen werden, wenn
`status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "hide"` mit einer triagierten
Meldung, um den Skill im selben auditierbaren Workflow auszublenden.

### `GET /api/v1/skills/-/appeals`

Moderator-/Admin-Endpunkt für die Aufnahme von Skill-Einsprüchen.

Query-Parameter:

- `status` (optional): `open` (Standard), `accepted`, `rejected` oder `all`
- `limit` (optional): Ganzzahl (1-200)
- `cursor` (optional): Paginierungs-Cursor

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Moderator-/Admin-Endpunkt zum Akzeptieren, Ablehnen oder Wiederöffnen eines Skill-Einspruchs.
`note` ist für `accepted` und `rejected` erforderlich; sie kann ausgelassen werden, wenn
`status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "restore"` mit einem akzeptierten Einspruch,
um den Skill wieder verfügbar zu machen.

### `GET /api/v1/skills/{slug}/versions`

Query-Parameter:

- `limit` (optional): Ganzzahl
- `cursor` (optional): Paginierungs-Cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Gibt Versionsmetadaten + Dateiliste zurück.

- `version.security` enthält den normalisierten Verifizierungsstatus des Scans und Scanner-Details
  (VirusTotal + LLM), sofern verfügbar.

### `GET /api/v1/skills/{slug}/scan`

Gibt Details zur Sicherheits-Scan-Verifizierung für eine Skill-Version zurück.

Query-Parameter:

- `version` (optional): bestimmte Versionszeichenfolge.
- `tag` (optional): löst eine getaggte Version auf (zum Beispiel `latest`).

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Enthält den normalisierten Verifizierungsstatus sowie scanner-spezifische Details.
- `security.capabilityTags` enthält deterministische Fähigkeits-/Risikobezeichnungen wie
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` und `posts-externally`, wenn erkannt.
- `security.hasScanResult` ist nur dann `true`, wenn ein Scanner ein definitives Urteil (`clean`, `suspicious` oder `malicious`) erzeugt hat.
- `moderation` ist ein aktueller Moderations-Snapshot auf Skill-Ebene, der aus der neuesten Version abgeleitet wird.
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
- `capabilityTag` (optional): Fähigkeitsfilter für Plugin-Pakete
- `target` / `hostTarget` (optional): Kurzform für `host:<target>`
- `os`, `arch`, `libc` (optional): Kurzform für Host-Fähigkeitsfilter
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (optional): Kurzform `true`/`1` für Tags zu Umgebungsanforderungen
- `externalService`, `binary`, `osPermission` (optional): Kurzform für benannte
  Tags zu Umgebungsanforderungen
- `artifactKind` (optional): `legacy-zip` oder `npm-pack`
- `npmMirror` (optional): `true`/`1`, um ClawPack-gestützte Paketversionen anzuzeigen,
  die über den npm-Mirror verfügbar sind

Hinweise:

- `GET /api/v1/code-plugins` und `GET /api/v1/bundle-plugins` bleiben Aliase mit fester Familie.
- Skill-Einträge bleiben durch die Skill-Registry gestützt und können weiterhin nur über `POST /api/v1/skills` veröffentlicht werden.
- `POST /api/v1/packages` ist weiterhin nur für Code-Plugin- und Bundle-Plugin-Releases vorgesehen.
- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können private Pakete für Publisher sehen, denen sie in Listen-/Suchergebnissen angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen darf.

### `GET /api/v1/packages/search`

Einheitliche Katalogsuche über Skills + Plugin-Pakete hinweg.

Query-Parameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl (1–100)
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `executesCode` (optional): `true` oder `false`
- `capabilityTag` (optional): Fähigkeitsfilter für Plugin-Pakete
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` und
  `osPermission` werden als Kurzformen für gängige Fähigkeits-Tags akzeptiert
- `artifactKind` (optional): `legacy-zip` oder `npm-pack`
- `npmMirror` (optional): `true`/`1`, um ClawPack-gestützte Paketversionen zu suchen,
  die über den npm-Mirror verfügbar sind

Hinweise:

- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können private Pakete für Publisher durchsuchen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen darf.
- Artefaktfilter werden durch indexierte Fähigkeits-Tags gestützt:
  `artifact:legacy-zip`, `artifact:npm-pack` und `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Gibt Paketdetail-Metadaten zurück.

Hinweise:

- Skills können im einheitlichen Katalog auch über diese Route aufgelöst werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen darf.

### `DELETE /api/v1/packages/{name}`

Löscht ein Paket und alle Releases per Soft Delete.

Hinweise:

- Erfordert ein API-Token für den Paketinhaber, einen Org-Publisher-Owner/-Admin,
  Plattform-Moderator oder Plattform-Admin.

### `GET /api/v1/packages/{name}/versions`

Gibt den Versionsverlauf zurück.

Query-Parameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungs-Cursor

Hinweise:

- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen darf.

### `GET /api/v1/packages/{name}/versions/{version}`

Gibt eine Paketversion zurück, einschließlich Dateimetadaten, Kompatibilität,
Fähigkeiten, Verifizierung, Artefaktmetadaten und Scan-Daten.

Hinweise:

- `version.artifact.kind` ist `legacy-zip` für Paketarchive der alten Welt oder
  `npm-pack` für ClawPack-gestützte Releases.
- ClawPack-Releases enthalten npm-kompatible Felder `npmIntegrity`, `npmShasum` und
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` und `version.staticScan` sind enthalten, wenn Scan-Daten vorhanden sind.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen darf.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Gibt die expliziten Artefakt-Resolver-Metadaten für eine Paketversion zurück.

Hinweise:

- Legacy-Paketversionen geben ein `legacy-zip`-Artefakt und eine Legacy-ZIP-
  `downloadUrl` zurück.
- ClawPack-Versionen geben ein `npm-pack`-Artefakt, npm-Integritätsfelder, eine
  `tarballUrl` und die Legacy-ZIP-Kompatibilitäts-URL zurück.
- Dies ist die OpenClaw-Resolver-Oberfläche; sie vermeidet das Erraten des Archivformats anhand
  einer gemeinsamen URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Lädt das Versionsartefakt über den expliziten Resolver-Pfad herunter.

Hinweise:

- ClawPack-Versionen streamen die exakt hochgeladenen npm-pack-`.tgz`-Bytes.
- Legacy-ZIP-Versionen leiten zu `/api/v1/packages/{name}/download?version=` weiter.
- Verwendet den Download-Rate-Bucket.

### `GET /api/v1/packages/{name}/readiness`

Gibt die berechnete Bereitschaft für die zukünftige OpenClaw-Nutzung zurück.

Bereitschaftsprüfungen umfassen:

- Status des offiziellen Kanals
- Verfügbarkeit der neuesten Version
- Verfügbarkeit des ClawPack-npm-pack-Artefakts
- Artefakt-Digest
- Herkunft von Quell-Repository und Commit
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

Query-Parameter:

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

Request-Body:

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
- Dies verfolgt nur die Migrationsbereitschaft. Es verändert OpenClaw nicht und generiert
  keine ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/Admin-Endpunkt für Review-Warteschlangen von Paket-Releases.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Query-Parameter:

- `status` (optional): `open` (Standard), `blocked`, `manual` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Statusbedeutungen:

- `open`: verdächtige, bösartige, ausstehende, unter Quarantäne gestellte, widerrufene oder gemeldete Releases.
- `blocked`: unter Quarantäne gestellte, widerrufene oder bösartige Releases.
- `manual`: jedes Release mit einer manuellen Moderationsüberschreibung.
- `all`: jedes Release mit manueller Überschreibung, nicht sauberem Scan-Status oder Paketmeldung.

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

Meldet ein Paket für eine Moderatorprüfung. Meldungen erfolgen auf Paketebene und sind optional
mit einer Version verknüpft. Sie speisen die Moderationswarteschlange, blenden Downloads jedoch nicht automatisch aus
und blockieren sie auch nicht selbst; Moderatoren sollten Release-Moderation verwenden, um
Artefakte zu genehmigen, unter Quarantäne zu stellen oder zu widerrufen.

Authentifizierung:

- Erfordert ein API-Token.

Request:

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

### `POST /api/v1/packages/{name}/appeal`

Endpunkt für Paketinhaber/Publisher zum Anfechten der Moderation eines Releases.

Authentifizierung:

- Erfordert ein API-Token für den Paketinhaber oder ein Publisher-Mitglied.

Request:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Einsprüche werden nur für Releases akzeptiert, die unter Quarantäne gestellt, widerrufen,
verdächtig oder bösartig sind. ClawHub behält einen offenen Einspruch pro Release.

Antwort:

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

Fordert einen Sicherheitsscan für den neuesten veröffentlichten Paket-Release an.

Authentifizierung:

- Erfordert ein API-Token für den Paketeigentümer, Publisher-Admin,
  Plattformmoderator oder Plattformadmin.
- Eigentümer und Publisher-Admins unterliegen dem Wiederherstellungslimit pro
  Release für Eigentümer. Plattformmoderatoren und Admins unterliegen diesem
  Limit nicht, aber ClawHub erlaubt weiterhin nur einen aktiven erneuten Scan
  pro Release.

Antwort:

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

Moderator-/Admin-Endpunkt für die Annahme von Paket-Einsprüchen.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Abfrageparameter:

- `status` (optional): `open` (Standard), `accepted`, `rejected` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Antwort:

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

Moderator-/Admin-Endpunkt zum Akzeptieren, Ablehnen oder erneuten Öffnen eines Einspruchs.

Anfrage:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` ist für `accepted` und `rejected` erforderlich; es kann weggelassen werden, wenn
`status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "approve"` mit einem akzeptierten
Einspruch, um den betroffenen Release im selben auditierbaren Workflow zu genehmigen.

Antwort:

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

Moderator-/Admin-Endpunkt für die Annahme von Paketmeldungen.

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

Eigentümer-/Moderator-Endpunkt für die Sichtbarkeit der Paketmoderation.

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
`finalAction: "revoke"` mit einer bestätigten Meldung, um die Release-Moderation im
selben auditierbaren Workflow anzuwenden.

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

Moderator-/Admin-Endpunkt für die Prüfung von Paket-Releases.

Anfrage:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Unterstützte Zustände:

- `approved`: manuell geprüft und erlaubt.
- `quarantined`: bis zur Nachverfolgung blockiert.
- `revoked`: blockiert, nachdem einem Release zuvor vertraut wurde.

Unter Quarantäne gestellte und widerrufene Releases geben `403` von Artefakt-Download-Routen zurück.
Jede Änderung schreibt einen Eintrag in das Audit-Protokoll.

### `POST /api/v1/packages/backfill/artifacts`

Nur für Admins verfügbarer Wartungsendpunkt zum Kennzeichnen älterer Paket-Releases mit
expliziten Metadaten zur Artefaktart.

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
- Vorhandene ClawPack-gestützte Zeilen ohne `artifactKind` werden als
  `npm-pack` repariert.
- Dadurch werden keine ClawPacks erzeugt und keine Artefakt-Bytes verändert.

### `GET /api/v1/packages/{name}/file`

Gibt den Rohtextinhalt für eine Paketdatei zurück.

Abfrageparameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig den neuesten Release.
- Verwendet den Lese-Raten-Bucket, nicht den Download-Bucket.
- Binärdateien geben `415` zurück.
- Dateigrößenlimit: 200 KB.
- Ausstehende VirusTotal-Scans blockieren Lesevorgänge nicht; schädliche Releases können an anderer Stelle dennoch zurückgehalten werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Publisher nicht lesen darf.

### `GET /api/v1/packages/{name}/download`

Lädt das alte deterministische ZIP-Archiv für einen Paket-Release herunter.

Abfrageparameter:

- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig den neuesten Release.
- Skills leiten zu `GET /api/v1/download` weiter.
- Plugin-/Paketarchive sind ZIP-Dateien mit einem `package/`-Stammverzeichnis, damit alte OpenClaw
  Clients weiterhin funktionieren.
- Diese Route bleibt ausschließlich ZIP-basiert. Sie streamt keine ClawPack-`.tgz`-Dateien.
- Antworten enthalten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- und
  `X-ClawHub-Artifact-Sha256`-Header für Integritätsprüfungen durch Resolver.
- Nur in der Registry vorhandene Metadaten werden nicht in das heruntergeladene Archiv eingefügt.
- Ausstehende VirusTotal-Scans blockieren Downloads nicht; schädliche Releases geben `403` zurück.
- Private Pakete geben `404` zurück, sofern der Aufrufer nicht der Eigentümer ist.

### `GET /api/npm/{package}`

Gibt ein npm-kompatibles Packument für ClawPack-gestützte Paketversionen zurück.

Hinweise:

- Nur Versionen mit hochgeladenen ClawPack-`npm-pack`-Tarballs werden aufgelistet.
- Alte reine ZIP-Versionen werden absichtlich ausgelassen.
- `dist.tarball`, `dist.integrity` und `dist.shasum` verwenden npm-kompatible
  Felder, sodass Benutzer npm bei Bedarf auf den Mirror verweisen können.
- Packuments für Scoped Packages unterstützen sowohl `/api/npm/@scope/name` als auch den von npm
  codierten Anfragepfad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt die exakt hochgeladenen ClawPack-Tarball-Bytes für npm-Mirror-Clients.

Hinweise:

- Verwendet den Download-Raten-Bucket.
- Download-Header enthalten ClawHub-SHA-256 sowie npm-Integritäts-/shasum-Metadaten.
- Moderations- und Zugriffskontrollen für private Pakete gelten weiterhin.

### `GET /api/v1/resolve`

Wird von der CLI verwendet, um einen lokalen Fingerabdruck einer bekannten Version zuzuordnen.

Abfrageparameter:

- `slug` (erforderlich)
- `hash` (erforderlich): 64-Zeichen-Hex-SHA-256 des Bundle-Fingerabdrucks

Antwort:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Lädt eine ZIP-Datei einer Skill-Version herunter.

Abfrageparameter:

- `slug` (erforderlich)
- `version` (optional): SemVer-Zeichenfolge
- `tag` (optional): Tag-Name (z. B. `latest`)

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Soft-gelöschte Versionen geben `410` zurück.
- Download-Statistiken werden als eindeutige Identitäten pro Stunde gezählt (`userId`, wenn das API-Token gültig ist, andernfalls IP).

## Authentifizierungsendpunkte (Bearer-Token)

Alle Endpunkte erfordern:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Validiert das Token und gibt das Benutzer-Handle zurück.

### `POST /api/v1/skills`

Veröffentlicht eine neue Version.

- Bevorzugt: `multipart/form-data` mit `payload`-JSON + `files[]`-Blobs.
- JSON-Text mit `files` (storageId-basiert) wird ebenfalls akzeptiert.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, löst die API diesen
  Publisher serverseitig auf und verlangt, dass der Akteur Publisher-Zugriff hat.
- Optionales Payload-Feld: `migrateOwner`. Wenn `true` mit `ownerHandle`, kann ein
  vorhandener Skill zu diesem Eigentümer verschoben werden, wenn der Akteur Admin/Eigentümer sowohl beim
  aktuellen als auch beim Ziel-Publisher ist. Ohne diese ausdrückliche Zustimmung werden Eigentümeränderungen
  abgelehnt.

### `POST /api/v1/packages`

Veröffentlicht einen `code-plugin`- oder `bundle-plugin`-Release.

- Erfordert Bearer-Token-Authentifizierung.
- Bevorzugt: `multipart/form-data` mit `payload`-JSON + `files[]`-Blobs.
- JSON-Text mit `files` (storageId-basiert) wird ebenfalls akzeptiert.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, dürfen nur Admins im Namen dieses Eigentümers veröffentlichen.

Validierungs-Highlights:

- `family` muss `code-plugin` oder `bundle-plugin` sein.
- Plugin-Pakete erfordern `openclaw.plugin.json`. ClawPack-`.tgz`-Uploads müssen
  es unter `package/openclaw.plugin.json` enthalten.
- Code-Plugins erfordern `package.json`, Quell-Repository-Metadaten, Quell-Commit-
  Metadaten, Konfigurationsschema-Metadaten, `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
- Nur vertrauenswürdige Publisher dürfen im `official`-Channel veröffentlichen.
- Veröffentlichungen im Namen anderer validieren die Berechtigung für den offiziellen Channel weiterhin gegen das Ziel-Eigentümerkonto.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-Delete / Wiederherstellung eines Skills (Eigentümer, Moderator oder Admin).

Optionaler JSON-Text:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wenn vorhanden, wird `reason` als Skill-Moderationsnotiz gespeichert und in das Audit-Protokoll kopiert.
Vom Eigentümer initiierte Soft-Deletes reservieren den Slug für 30 Tage; danach kann der Slug von
einem anderen Publisher beansprucht werden. Die Löschantwort enthält `slugReservedUntil`, wenn dieser Ablauf gilt.
Moderator-/Admin-Ausblendungen und Sicherheitsentfernungen laufen nicht auf diese Weise ab.

Löschantwort:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: nicht authentifiziert
- `403`: verboten
- `404`: Skill/Benutzer nicht gefunden
- `500`: interner Serverfehler

### `POST /api/v1/users/publisher`

Nur für Admins. Stellt sicher, dass für ein Handle ein Organisations-Publisher existiert. Wenn das Handle noch auf einen
alten gemeinsam genutzten Benutzer-/persönlichen Publisher zeigt, migriert der Endpunkt ihn zuerst in einen Organisations-Publisher.

- Text: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Nur Admins. Reserviert Root-Slugs und Paketnamen für einen rechtmäßigen Eigentümer, ohne ein
Release zu veröffentlichen. Paketnamen werden zu privaten Platzhalterpaketen ohne Release-Zeilen, sodass derselbe
Eigentümer später das echte Code-Plugin- oder Bundle-Plugin-Release unter diesem Namen veröffentlichen kann.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwort: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpunkte zur Verwaltung von Eigentümer-Slugs

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwort: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwort: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Hinweise:

- Beide Endpunkte erfordern Authentifizierung per API-Token und funktionieren nur für den Skill-Eigentümer.
- `rename` behält den vorherigen Slug als Weiterleitungsalias bei.
- `merge` blendet den Quell-Listing-Eintrag aus und leitet den Quell-Slug zum Ziel-Listing um.

### Endpunkte zur Übertragung der Eigentümerschaft

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Antwort: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Antwort (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Antwortformat: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Sperrt einen Benutzer und löscht eigene Skills endgültig (nur Moderator/Admin).

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

Hebt die Sperre eines Benutzers auf und stellt geeignete Skills wieder her (nur Admin).

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

Ändert die Rolle eines Benutzers (nur Admin).

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
- `limit` (optional): maximale Ergebnisse (Standard 20, max. 200)

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

Einen Stern hinzufügen/entfernen (Hervorhebungen). Beide Endpunkte sind idempotent.

Antworten:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy-CLI-Endpunkte (veraltet)

Für ältere CLI-Versionen weiterhin unterstützt:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Siehe `DEPRECATIONS.md` für den Entfernungsplan.

## Registry-Erkennung (`/.well-known/clawhub.json`)

Die CLI kann Registry-/Auth-Einstellungen von der Website erkennen:

- `/.well-known/clawhub.json` (JSON, bevorzugt)
- `/.well-known/clawdhub.json` (Legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Wenn Sie selbst hosten, stellen Sie diese Datei bereit (oder setzen Sie `CLAWHUB_REGISTRY` explizit; Legacy: `CLAWDHUB_REGISTRY`).
