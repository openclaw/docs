---
read_when:
    - Endpunkte hinzufügen/ändern
    - CLI-↔-Registry-Anfragen debuggen
summary: HTTP-API-Referenz (öffentliche Endpunkte + CLI-Endpunkte + Authentifizierung).
x-i18n:
    generated_at: "2026-06-30T22:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (Standard).

Alle v1-Pfade liegen unter `/api/v1/...`.
Legacy-`/api/...` und `/api/cli/...` bleiben aus Kompatibilitätsgründen bestehen (siehe `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Wiederverwendung des öffentlichen Katalogs

Drittanbieter-Verzeichnisse dürfen die öffentlichen Lese-Endpunkte verwenden, um ClawHub-Skills aufzulisten oder zu durchsuchen. Bitte cachen Sie Ergebnisse, beachten Sie `429`/`Retry-After`, verlinken Sie Nutzer zurück zum kanonischen ClawHub-Eintrag (`https://clawhub.ai/<owner>/skills/<slug>`) und vermeiden Sie den Eindruck, ClawHub würde die Drittanbieter-Website unterstützen. Versuchen Sie nicht, versteckte, private oder durch Moderation blockierte Inhalte außerhalb der öffentlichen API-Oberfläche zu spiegeln.

Web-Slug-Kurzformen werden über Registry-Familien hinweg aufgelöst, API-Clients sollten jedoch die von Lese-Endpunkten zurückgegebenen kanonischen URLs verwenden, anstatt die Routenpriorität nachzubauen.

## Ratenlimits

Durchsetzungsmodell:

- Anonyme Anfragen: pro IP durchgesetzt.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Nutzer-Bucket durchgesetzt.
- Wenn das Token fehlt/ungültig ist, fällt das Verhalten auf IP-Durchsetzung zurück.
- Authentifizierte Schreib-Endpunkte sollten kein bloßes `Unauthorized` zurückgeben, wenn der Server den Grund kennt. Fehlende Tokens, ungültige/widerrufene Tokens und gelöschte/gesperrte/deaktivierte Konten sollten jeweils handlungsrelevanten Text erhalten, damit CLI-Clients Nutzern mitteilen können, was sie blockiert hat.

- Lesen: 3000/min pro IP, 12000/min pro Schlüssel
- Schreiben: 300/min pro IP, 3000/min pro Schlüssel
- Download: 1200/min pro IP, 6000/min pro Schlüssel (Download-Endpunkte)

Header:

- Legacy-Kompatibilität: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardisiert: `RateLimit-Limit`, `RateLimit-Reset`
- Bei `429`: `X-RateLimit-Remaining: 0` und `RateLimit-Remaining: 0`
- Bei `429`: `Retry-After`

Header-Semantik:

- `X-RateLimit-Reset`: absolute Unix-Epoch-Sekunden
- `RateLimit-Reset`: Sekunden bis zum Zurücksetzen (Verzögerung)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exaktes verbleibendes Budget, wenn vorhanden.
  Erfolgreiche geshardete Anfragen lassen diesen Header weg, anstatt einen ungefähren globalen Wert zurückzugeben.
- `Retry-After`: Sekunden, die vor einem erneuten Versuch gewartet werden soll (Verzögerung) bei `429`

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

Client-Hinweise:

- Wenn `Retry-After` vorhanden ist, warten Sie vor dem erneuten Versuch so viele Sekunden.
- Verwenden Sie Jitter-Backoff, um synchronisierte Wiederholungsversuche zu vermeiden.
- Wenn `Retry-After` fehlt, fallen Sie auf `RateLimit-Reset` zurück (oder berechnen Sie den Wert aus `X-RateLimit-Reset`).

IP-Quelle:

- Verwendet vertrauenswürdige Client-IP-Header, einschließlich `cf-connecting-ip`, nur wenn das Deployment vertrauenswürdige weitergeleitete Header ausdrücklich aktiviert.
- ClawHub verwendet vertrauenswürdige Forwarding-Header, um Client-IPs am Edge zu identifizieren.
- Wenn keine vertrauenswürdige Client-IP verfügbar ist, verwenden anonyme Anfragen Fallback-Buckets, die nur nach Ratenlimit-Art begrenzt sind. Diese Fallback-Buckets enthalten keine vom Aufrufer gelieferten Pfade, Slugs, Paketnamen, Versionen, Query-Strings oder andere Artefaktparameter.

## Fehlerantworten

Öffentliche v1-Fehlerantworten sind Klartext mit `content-type: text/plain; charset=utf-8`.
Dies umfasst Validierungsfehler (`400`), fehlende öffentliche Ressourcen (`404`), Authentifizierungs- und Berechtigungsfehler (`401`/`403`), Ratenlimits (`429`) und blockierte Downloads. Clients sollten den Antwortkörper als menschenlesbaren String lesen. Unbekannte Query-Parameter werden aus Kompatibilitätsgründen ignoriert, aber erkannte Query-Parameter mit ungültigen Werten geben `400` zurück.

## Öffentliche Endpunkte (keine Authentifizierung)

### `GET /api/v1/search`

Query-Parameter:

- `q` (erforderlich): Such-String
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Hinweise:

- Ergebnisse werden in Relevanzreihenfolge zurückgegeben (Embedding-Ähnlichkeit + exakte Slug-/Namens-Token-Boosts + ein kleiner Popularitäts-Prior).
- Relevanz ist stärker als Popularität. Eine präzise Übereinstimmung mit einem Slug- oder Anzeigenamen-Token kann eine ungenauere Übereinstimmung mit deutlich stärkerem Engagement übertreffen.
- ASCII-Text wird an Wort- und Satzzeichen-Grenzen tokenisiert. Beispielsweise enthält `personal-map` ein eigenständiges `map`-Token, während `amap-jsapi-skill` `amap`, `jsapi` und `skill` enthält; eine Suche nach `map` gibt `personal-map` daher eine stärkere lexikalische Übereinstimmung als `amap-jsapi-skill`.
- Popularität ist logarithmisch skaliert und gedeckelt. Skills mit hohem Engagement können niedriger eingestuft werden, wenn der Query-Text eine schwächere Übereinstimmung ist.
- Verdächtiger oder versteckter Moderationsstatus kann einen Skill abhängig von Aufruferfiltern und aktuellem Moderationsstatus aus der öffentlichen Suche entfernen.

Hinweise zur Auffindbarkeit für Publisher:

- Platzieren Sie die Begriffe, nach denen Nutzer wortwörtlich suchen werden, im Anzeigenamen, in der Zusammenfassung und in den Tags. Verwenden Sie ein eigenständiges Slug-Token nur, wenn es auch eine stabile Identität ist, die Sie behalten möchten.
- Benennen Sie einen Slug nicht nur um, um eine einzelne Anfrage zu bedienen, es sei denn, der neue Slug ist ein besserer langfristiger kanonischer Name. Alte Slugs werden zu Redirect-Aliassen, aber die kanonische URL, der angezeigte Slug und zukünftige Such-Digests verwenden den neuen Slug.
- Umbenennungs-Aliasse erhalten die Auflösung für alte URLs und Installationen, die über die Registry aufgelöst werden, aber das Suchranking basiert auf den kanonischen Skill-Metadaten, nachdem die Umbenennung indexiert wurde. Vorhandene Statistiken bleiben beim Skill.
- Wenn ein Skill unerwartet unsichtbar ist, prüfen Sie zuerst den Moderationsstatus mit `clawhub inspect @owner/slug`, während Sie angemeldet sind, bevor Sie rankingbezogene Metadaten ändern.

### `GET /api/v1/skills`

Query-Parameter:

- `limit` (optional): Ganzzahl (1–200)
- `cursor` (optional): Paginierungs-Cursor für jede Nicht-`trending`-Sortierung
- `sort` (optional): `updated` (Standard), `recommended` (Alias: `default`), `createdAt` (Alias: `newest`), `downloads`, `stars` (Alias: `rating`), Legacy-Installationsaliase `installsCurrent`/`installs`/`installsAllTime` werden `downloads` zugeordnet, `trending`
- `nonSuspiciousOnly` (optional): `true`, um verdächtige (`flagged.suspicious`) Skills auszublenden
- `nonSuspicious` (optional): Legacy-Alias für `nonSuspiciousOnly`

Ungültige `sort`-Werte geben `400` zurück.

Hinweise:

- `recommended` verwendet Engagement- und Aktualitätssignale.
- `trending` sortiert nach Installationen in den letzten 7 Tagen (telemetriebasiert).
- `createdAt` ist für Crawls neuer Skills stabil; `updated` ändert sich, wenn vorhandene Skills erneut veröffentlicht werden.
- Wenn `nonSuspiciousOnly=true`, können cursorbasierte Sortierungen auf einer Seite weniger als `limit` Elemente zurückgeben, da verdächtige Skills nach dem Abrufen der Seite herausgefiltert werden.
- Verwenden Sie `nextCursor`, um die Paginierung fortzusetzen, wenn vorhanden. Eine kurze Seite bedeutet für sich genommen nicht das Ende der Ergebnisse.

Antwort:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- Alte Slugs, die durch Owner-Umbenennungs-/Merge-Flows erstellt wurden, werden zum kanonischen Skill aufgelöst.
- `metadata.os`: in Skill-Frontmatter deklarierte OS-Einschränkungen (z. B. `["macos"]`, `["linux"]`). `null`, wenn nicht deklariert.
- `metadata.systems`: Nix-Systemziele (z. B. `["aarch64-darwin", "x86_64-linux"]`). `null`, wenn nicht deklariert.
- `metadata` ist `null`, wenn der Skill keine Plattformmetadaten hat.
- `moderation` ist nur enthalten, wenn der Skill markiert ist oder der Owner ihn ansieht.

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
- Öffentliche Aufrufer erhalten nur für bereits markierte sichtbare Skills `200`.
- Evidenz wird für öffentliche Aufrufer redigiert und enthält Roh-Snippets nur für Owner/Moderatoren.

### `POST /api/v1/skills/{slug}/report`

Meldet einen Skill zur Prüfung durch Moderatoren. Meldungen gelten auf Skill-Ebene, sind optional mit einer Version verknüpft und fließen in die Skill-Meldewarteschlange ein.

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

### `GET /api/v1/skills/-/reports`

Moderator-/Admin-Endpunkt für den Eingang von Skill-Meldungen.

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

`note` ist für `confirmed` und `dismissed` erforderlich; es kann weggelassen werden, wenn `status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "hide"` mit einer triagierten Meldung, um den Skill im selben auditierbaren Workflow auszublenden.

### `GET /api/v1/skills/{slug}/versions`

Query-Parameter:

- `limit` (optional): Ganzzahl
- `cursor` (optional): Paginierungs-Cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Gibt Versionsmetadaten + Dateiliste zurück.

- `version.security` enthält normalisierten Prüfstatus des Scans und Scanner-Details
  (VirusTotal + LLM), wenn verfügbar.

### `GET /api/v1/skills/{slug}/scan`

Gibt Details zur Sicherheits-Scan-Prüfung für eine Skill-Version zurück.

Query-Parameter:

- `version` (optional): spezifischer Versions-String.
- `tag` (optional): löst eine getaggte Version auf (zum Beispiel `latest`).

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Enthält den normalisierten Verifizierungsstatus plus scannerspezifische Details.
- `security.hasScanResult` ist nur dann `true`, wenn ein Scanner ein endgültiges Urteil (`clean`, `suspicious` oder `malicious`) erzeugt hat.
- `moderation` ist ein aktueller Moderations-Snapshot auf Skill-Ebene, der aus der neuesten Version abgeleitet wird.
- Wenn Sie eine historische Version abfragen, prüfen Sie `moderation.matchesRequestedVersion` und `moderation.sourceVersion`, bevor Sie `moderation` und `security` als denselben Versionskontext behandeln.

### `POST /api/v1/skills/-/scan`

Authentifizierter Übermittlungsendpunkt für neue ClawScan-Jobs.

Lokale Upload-Scans werden nicht mehr unterstützt. Anfragen mit
`multipart/form-data` oder `{ "source": { "kind": "upload" } }` geben `410` zurück.

Veröffentlichte Scans verwenden JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Hinweise:

- Scan-Anfrage-Payloads und herunterladbare Berichte laufen nach dem Aufbewahrungsfenster aus dem Scan-Anfrage-Speicher ab.
- Veröffentlichte Scans erfordern Verwaltungszugriff als Owner/Publisher oder Moderator-/Administratorrechte der Plattform.
- Veröffentlichte Scans schreiben nur zurück, wenn `update: true` gesetzt ist und der Scan erfolgreich abgeschlossen wird.
- Die Antwort ist `202` mit `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scan-Jobs sind asynchron. Manuelle Scan-Anfragen werden vor normaler Veröffentlichungs-/Backfill-Arbeit priorisiert, aber der Abschluss hängt weiterhin von der Worker-Verfügbarkeit ab.

### `GET /api/v1/skills/-/scan/{scanId}`

Authentifizierter Polling-Endpunkt für einen übermittelten Scan.

- Gibt den Status „queued“/„running“/„succeeded“/„failed“ zurück.
- Gibt `queue.queuedAhead` und `queue.position` zurück, solange der Job in der Warteschlange ist, damit Clients anzeigen können, wie viele priorisierte manuelle Scans vor der Anfrage stehen. Sehr große Warteschlangen werden begrenzt und mit `queuedAheadIsEstimate: true` gemeldet.
- Wenn verfügbar, enthält `report` die Abschnitte `clawscan`, `skillspector`, `staticAnalysis` und `virustotal`.
- Fehlgeschlagene Scan-Jobs geben `status: "failed"` mit `lastError` zurück.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Authentifizierter Endpunkt für Berichtsarchive.

- Erfordert einen erfolgreichen Scan; nicht terminale Scans geben `409` zurück.
- Gibt eine ZIP-Datei mit `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` und `README.md` zurück.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Authentifizierter Endpunkt für gespeicherte Berichtsarchive für übermittelte Versionen.

- Erfordert Verwaltungszugriff als Owner/Publisher auf den Skill oder das Plugin oder Moderator-/Administratorrechte der Plattform.
- Gibt gespeicherte Scan-Ergebnisse für die exakt übermittelte Version zurück, einschließlich blockierter oder ausgeblendeter Versionen.
- `kind` ist standardmäßig `skill`; verwenden Sie `kind=plugin` für Plugin-/Paket-Scans.
- Gibt dieselbe ZIP-Struktur wie Downloads von Scan-Anfragen zurück.

### `POST /api/v1/skills/-/scan/batch`

Nur für Administratoren zugängliche kanonische Route für Batch-Rescans. Sie akzeptiert dieselbe Payload-Struktur wie das veraltete `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Nur für Administratoren zugängliche kanonische Batch-Status-Route. Sie akzeptiert `{ "jobIds": ["..."] }` und gibt dieselben aggregierten Zähler zurück wie das veraltete `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Gibt den Skill-Card-Verifizierungsumschlag zurück, der von `clawhub skill verify` verwendet wird.

Abfrageparameter:

- `version` (optional): spezifischer Versionsstring.
- `tag` (optional): löst eine getaggte Version auf (zum Beispiel `latest`).

Hinweise:

- `ok` ist nur dann `true`, wenn die ausgewählte Version eine generierte Skill Card hat, nicht durch Moderation als Malware blockiert ist und die ClawScan-Verifizierung sauber ist.
- Skill-Identität, Publisher-Identität und Metadaten der ausgewählten Version sind Umschlagfelder auf oberster Ebene (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), damit Shell-Automatisierung sie lesen kann, ohne verschachtelte Wrapper zu entpacken.
- `security` ist das ClawScan-/Sicherheitsurteil auf oberster Ebene. Automatisierung sollte sich an `ok`, `decision`, `reasons` und `security.status` orientieren.
- `security.signals` enthält unterstützende Scanner-Belege wie `staticScan`, `virusTotal` und `skillSpector`.
- `security.signals.dependencyRegistry` bleibt aus Kompatibilitätsgründen für v1-Antworten erhalten, aber der Existenzscanner für das Dependency-Register ist eingestellt, und dieser Schlüssel ist immer `null`.
- `provenance` ist nur dann `server-resolved-github-import`, wenn ClawHub während der Veröffentlichung oder des Imports ein GitHub-Repo, eine Ref, einen Commit oder einen Pfad aufgelöst und gespeichert hat; andernfalls ist es `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Gibt aktuelle kompakte Sicherheitsurteile für exakte Skill-Versionen zurück. Dieser
Sammlungsendpunkt ist für Clients gedacht, die bereits wissen, welche installierten
ClawHub-Skill-Versionen sie anzeigen müssen, zum Beispiel OpenClaw Control UI.

Anfrage:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Hinweise:

- `items` muss 1-100 eindeutige `{ slug, version }`-Paare enthalten.
- Ergebnisse gelten pro Element; ein fehlender Skill oder eine fehlende Version lässt nicht die gesamte Antwort fehlschlagen.
- Die Antwort ist ausschließlich sicherheitsbezogen. Sie enthält keine Skill-Card-Daten, keinen Status generierter Cards, keine Artefaktdateilisten und keine detaillierten Scanner-Payloads.
- `security.signals` enthält nur unterstützende Belege auf Statusebene; verwenden Sie `/scan` oder die ClawHub-Seite für Sicherheitsaudits, um vollständige Scanner-Details zu erhalten.
- `security.signals.dependencyRegistry` bleibt aus Kompatibilitätsgründen für v1-Antworten erhalten, aber der Existenzscanner für das Dependency-Register ist eingestellt, und dieser Schlüssel ist immer `null`.
- Das Fehlen einer Skill Card beeinflusst `ok`, `decision` oder `reasons` dieses Endpunkts nicht; Clients sollten die installierte `skill-card.md` lokal lesen, wenn sie Card-Inhalte benötigen.
- Verwenden Sie `/verify`, wenn Sie den Skill-Card-Verifizierungsumschlag für einen einzelnen Skill benötigen, `/card`, wenn Sie generiertes Card-Markdown benötigen, und `/scan`, wenn Sie detaillierte Scanner-Daten benötigen.

Antwort:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Gibt rohen Textinhalt zurück.

Abfrageparameter:

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

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungs-Cursor
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `sort` (optional): `updated` (Standard), `recommended`, `trending`, `downloads`, Legacy-Alias `installs`
- `category` (optional): Plugin-Kategoriefilter. Wird nur unterstützt, wenn die
  Anfrage auf Plugin-Pakete beschränkt ist (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` oder Paket-Endpunkte mit
  `family=code-plugin`/`family=bundle-plugin`). Kontrollierte Kategorien und
  Legacy-v1-Filter-Aliasse sind unter `GET /api/v1/plugins` dokumentiert.

Hinweise:

- Ungültige Werte für `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` oder `sort` geben `400` zurück. Unbekannte Abfrageparameter werden ignoriert.
- `GET /api/v1/code-plugins` und `GET /api/v1/bundle-plugins` bleiben Aliasse mit fester Familie.
- Skill-Einträge bleiben durch die Skill-Registry abgesichert und können weiterhin nur über `POST /api/v1/skills` veröffentlicht werden.
- `POST /api/v1/packages` gilt weiterhin nur für Code-Plugin- und Bundle-Plugin-Releases.
- Anonyme Aufrufer sehen nur öffentliche Paket-Channels.
- Authentifizierte Aufrufer können private Pakete für Publisher sehen, denen sie in Listen-/Suchergebnissen angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.

### `GET /api/v1/packages/search`

Einheitliche Katalogsuche über Skills und Plugin-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl (1–100)
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `category` (optional): Plugin-Kategoriefilter. Wird nur unterstützt, wenn die
  Anfrage auf Plugin-Pakete beschränkt ist. Kontrollierte Kategorien und Legacy-v1-
  Filter-Aliasse sind unter `GET /api/v1/plugins` dokumentiert.

Hinweise:

- Ungültige Werte für `family`, `channel`, `isOfficial`, `featured` oder
  `highlightedOnly` geben `400` zurück. Unbekannte Abfrageparameter werden ignoriert.
- Anonyme Aufrufer sehen nur öffentliche Paket-Channels.
- Authentifizierte Aufrufer können private Pakete für Publisher suchen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.

### `GET /api/v1/plugins`

Reines Plugin-Katalog-Browsing über Code-Plugin- und Bundle-Plugin-Pakete hinweg.

Abfrageparameter:

- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor
- `isOfficial` (optional): `true` oder `false`
- `sort` (optional): `recommended` (Standard), `trending`, `downloads`, `updated`, Legacy-Alias `installs`
- `category` (optional): Plugin-Kategoriefilter. Aktuelle Werte:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Legacy-v1-Filter-Aliasse bleiben auf Lese-Endpunkten akzeptiert:

- `mcp-tooling`, `data` und `automation` werden zu `tools` aufgelöst.
- `observability` und `deployment` werden zu `gateway` aufgelöst.
- `dev-tools` wird zu `runtime` aufgelöst.

`trending` ist eine Sieben-Tage-Installations-/Download-Rangliste und verwendet keine Gesamtwerte über die gesamte Zeit.
Auf dem einheitlichen Endpunkt `/api/v1/packages` ist es nur für Plugins verfügbar; verwenden Sie
`/api/v1/skills?sort=trending` für den Skill-Katalog.

Legacy-Aliasse werden nicht als gespeicherte oder vom Autor deklarierte Kategoriewerte akzeptiert.

### `GET /api/v1/skills/export`

Massenexport der neuesten öffentlichen Skills für die Offline-Analyse.

Authentifizierung:

- API-Token erforderlich.

Abfrageparameter:

- `startDate` (erforderlich): untere Grenze in Unix-Millisekunden für Skill-`updatedAt`.
- `endDate` (erforderlich): obere Grenze in Unix-Millisekunden für Skill-`updatedAt`.
- `limit` (optional): Ganzzahl (1-250), Standard `250`.
- `cursor` (optional): Paginierungs-Cursor aus der vorherigen Antwort.

Antwort:

- Body: ZIP-Archiv.
- Jeder exportierte Skill hat sein Stammverzeichnis unter `{publisher}/{slug}/`.
- Gehostete Skills enthalten die neuesten gespeicherten Versionsdateien und werden in
  `_manifest.json` mit `sourceRef: "public-clawhub"` aufgeführt.
- Aktuelle GitHub-gestützte Skills mit einem `clean`- oder `suspicious`-Scan enthalten
  `_source_handoff.json` mit `sourceRef: "public-github"`, Repository, Commit, Pfad,
  Inhalts-Hash und Archiv-URL. Sie enthalten keine von ClawHub gehosteten Quelldateien.
- Jeder Skill enthält `_export_skill_meta.json`.
- `_manifest.json` ist immer im ZIP-Stammverzeichnis enthalten.
- `_errors.json` ist enthalten, wenn einzelne Skills oder Dateien nicht
  exportiert werden konnten.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Massenexport der neuesten öffentlichen Plugin-Releases für Offline-Analysen.

Authentifizierung:

- API-Token erforderlich.

Abfrageparameter:

- `startDate` (erforderlich): Untere Grenze in Unix-Millisekunden für Plugin-`updatedAt`.
- `endDate` (erforderlich): Obere Grenze in Unix-Millisekunden für Plugin-`updatedAt`.
- `limit` (optional): Ganzzahl (1-250), Standardwert `250`.
- `cursor` (optional): Paginierungs-Cursor aus der vorherigen Antwort.
- `family` (optional): `code-plugin` oder `bundle-plugin`. Weglassen bedeutet beide
  Plugin-Familien.

Antwort:

- Body: ZIP-Archiv.
- Jedes exportierte Plugin ist unter `{family}/{packageName}/` verwurzelt.
- Jedes exportierte Plugin enthält die gespeicherten Dateien des neuesten Releases.
- Exportmetadaten pro Plugin werden unter
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` gespeichert.
- `_manifest.json` ist immer im ZIP-Wurzelverzeichnis enthalten.
- `_errors.json` ist enthalten, wenn einzelne Plugins oder Dateien nicht
  exportiert werden konnten.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Reine Plugin-Suche über `code-plugin`- und `bundle-plugin`-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Suchzeichenfolge
- `limit` (optional): Ganzzahl (1-100)
- `isOfficial` (optional): `true` oder `false`
- `category` (optional): Filter für Plugin-Kategorien. Aktuelle Werte:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Hinweise:

- Die unter `GET /api/v1/plugins` dokumentierten Legacy-v1-Filteraliasse werden ebenfalls
  akzeptiert.
- Kategorie-Filterung ist ein echter API-Filter, der durch Digest-Zeilen für
  Plugin-Kategorien gestützt wird, keine Umschreibung der Suchabfrage.
- Ergebnisse werden nach Relevanz sortiert zurückgegeben und derzeit nicht paginiert.
- Sortiersteuerelemente der Browser-UI für die Plugin-Suche sortieren die geladenen Relevanzergebnisse neu
  und entsprechen damit dem aktuellen Browse-Verhalten von `/skills`.

### `GET /api/v1/packages/{name}`

Gibt Detailmetadaten des Pakets zurück.

Hinweise:

- Skills können im vereinheitlichten Katalog ebenfalls über diese Route aufgelöst werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `DELETE /api/v1/packages/{name}`

Löscht ein Paket und alle Releases per Soft Delete.

Hinweise:

- Erfordert ein API-Token für den Paketinhaber, einen Inhaber/Admin des Org-Publishers,
  Plattformmoderator oder Plattformadmin.

### `GET /api/v1/packages/{name}/versions`

Gibt den Versionsverlauf zurück.

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungs-Cursor

Hinweise:

- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/versions/{version}`

Gibt eine Paketversion zurück, einschließlich Dateimetadaten, Kompatibilität,
Verifizierung, Artefaktmetadaten und Scan-Daten.

Hinweise:

- `version.artifact.kind` ist `legacy-zip` für Paketarchive der alten Welt oder
  `npm-pack` für ClawPack-gestützte Releases.
- ClawPack-Releases enthalten npm-kompatible Felder `npmIntegrity`, `npmShasum` und
  `npmTarballName`.
- `version.sha256hash` ist veraltete Kompatibilitätsmetadaten für alte Clients. Es
  hasht die exakten ZIP-Bytes, die von `/api/v1/packages/{name}/download` zurückgegeben werden.
  Moderne Clients sollten `version.artifact.sha256` verwenden, das das
  kanonische Release-Artefakt identifiziert.
- `version.vtAnalysis`, `version.llmAnalysis` und `version.staticScan` sind
  enthalten, wenn Scan-Daten vorhanden sind.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Gibt die exakte Sicherheits- und Vertrauenszusammenfassung des Paket-Releases für Installationsclients
zurück. Dies ist die öffentliche OpenClaw-Konsumoberfläche zur Entscheidung, ob ein
aufgelöstes Release installiert werden kann.

Authentifizierung:

- Öffentlicher Lese-Endpunkt. Kein Token eines Inhabers, Publishers, Moderators oder Admins
  erforderlich.

Antwort:

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

Antwortfelder:

- `package.name`, `package.displayName` und `package.family` identifizieren das
  aufgelöste Registry-Paket.
- `release.releaseId`, `release.version` und `release.createdAt` identifizieren das
  exakte Release, das bewertet wurde.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` und `release.npmTarballName` sind vorhanden, wenn sie für
  das Release-Artefakt bekannt sind.
- `trust.scanStatus` ist der effektive Vertrauensstatus, abgeleitet aus Scanner-Eingaben
  und manueller Release-Moderation.
- `trust.moderationState` ist nullable. Es ist `null`, wenn keine manuelle Release-
  Moderation existiert.
- `trust.blockedFromDownload` ist das Installationsblock-Signal. OpenClaw und andere
  Installationsclients sollten die Installation blockieren, wenn dieser Wert `true` ist, statt
  Blockierregeln aus Scanner- oder Moderationsfeldern erneut abzuleiten.
- `trust.reasons` ist die benutzerseitige und Audit-Erklärungsliste. Grundcodes
  sind stabile, kompakte Zeichenfolgen wie `manual:quarantined`, `scan:malicious`
  und `package:malicious`.
- `trust.pending` bedeutet, dass eine oder mehrere Vertrauenseingaben noch auf Abschluss warten.
- `trust.stale` bedeutet, dass die Vertrauenszusammenfassung aus veralteten Eingaben berechnet wurde und
  vor einer Allow-Entscheidung mit hoher Konfidenz als aktualisierungsbedürftig behandelt werden sollte.

Hinweise:

- Dieser Endpunkt ist versionsgenau. Clients sollten ihn aufrufen, nachdem sie die
  Paketversion aufgelöst haben, die sie installieren möchten, nicht nur nachdem sie die neuesten
  Paketmetadaten gelesen haben.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.
- Dieser Endpunkt ist absichtlich enger gefasst als Moderationsendpunkte für Inhaber/Moderatoren.
  Er legt die Installationsentscheidung und öffentliche Erklärung offen, nicht
  Reporter-Identitäten, Report-Inhalte, private Beweise oder interne Review-
  Zeitpläne.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Gibt die expliziten Artefakt-Resolver-Metadaten für eine Paketversion zurück.

Hinweise:

- Legacy-Paketversionen geben ein `legacy-zip`-Artefakt und eine Legacy-ZIP-
  `downloadUrl` zurück.
- ClawPack-Versionen geben ein `npm-pack`-Artefakt, npm-Integritätsfelder, eine
  `tarballUrl` und die Legacy-ZIP-Kompatibilitäts-URL zurück.
- Dies ist die OpenClaw-Resolver-Oberfläche; sie vermeidet, das Archivformat aus
  einer gemeinsamen URL zu erraten.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Lädt das Versionsartefakt über den expliziten Resolver-Pfad herunter.

Hinweise:

- ClawPack-Versionen streamen die exakt hochgeladenen npm-pack-`.tgz`-Bytes.
- Legacy-ZIP-Versionen leiten zu `/api/v1/packages/{name}/download?version=` weiter.
- Verwendet den Download-Rate-Bucket.

### `GET /api/v1/packages/{name}/readiness`

Gibt die berechnete Bereitschaft für die zukünftige OpenClaw-Nutzung zurück.

Bereitschaftsprüfungen umfassen:

- offiziellen Kanalstatus
- Verfügbarkeit der neuesten Version
- Verfügbarkeit des ClawPack-npm-pack-Artefakts
- Artefakt-Digest
- Herkunft von Quell-Repo und Commit
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
  `all` (Standardwert).
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
- `packageName` wird als npm-Name normalisiert; das Paket kann für geplante
  Migrationen fehlen.
- Dies verfolgt nur die Migrationsbereitschaft. Es verändert OpenClaw nicht und generiert
  keine ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/Admin-Endpunkt für Review-Warteschlangen von Paket-Releases.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Abfrageparameter:

- `status` (optional): `open` (Standardwert), `blocked`, `manual` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Statusbedeutungen:

- `open`: verdächtige, bösartige, ausstehende, unter Quarantäne gestellte, widerrufene oder gemeldete Releases.
- `blocked`: unter Quarantäne gestellte, widerrufene oder bösartige Releases.
- `manual`: jedes Release mit einer manuellen Moderationsüberschreibung.
- `all`: jedes Release mit einer manuellen Überschreibung, einem nicht sauberen Scan-Status oder einem Paketreport.

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

Meldet ein Paket für Moderator-Review. Reports gelten auf Paketebene und sind optional
mit einer Version verknüpft. Sie fließen in die Moderationswarteschlange ein, blenden Downloads
aber nicht automatisch aus und blockieren sie auch nicht eigenständig; Moderatoren sollten Release-Moderation verwenden, um
Artefakte zu genehmigen, unter Quarantäne zu stellen oder zu widerrufen.

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

Endpunkt für Moderatoren/Admins zur Annahme von Paketmeldungen.

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

Endpunkt für Owner/Moderatoren zur Sichtbarkeit der Paketmoderation.

Authentifizierung:

- Erfordert ein API-Token für den Paket-Owner, ein Publisher-Mitglied, einen Moderator oder
  Admin-Benutzer.

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

Endpunkt für Moderatoren/Admins zum Abschließen oder erneuten Öffnen von Paketmeldungen.

Anfrage:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` ist für `confirmed` und `dismissed` erforderlich; sie kann weggelassen werden, wenn
`status` wieder auf `open` gesetzt wird. Übergeben Sie `finalAction: "quarantine"` oder
`finalAction: "revoke"` mit einer bestätigten Meldung, um Release-Moderation im
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

Endpunkt für Moderatoren/Admins zur Prüfung von Paket-Releases.

Anfrage:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Unterstützte Zustände:

- `approved`: manuell geprüft und zugelassen.
- `quarantined`: bis zur Nachverfolgung blockiert.
- `revoked`: blockiert, nachdem ein Release zuvor als vertrauenswürdig galt.

Unter Quarantäne gestellte und widerrufene Releases geben bei Artefakt-Download-Routen `403` zurück.
Jede Änderung schreibt einen Audit-Log-Eintrag.

### `GET /api/v1/packages/{name}/file`

Gibt den Rohtextinhalt für eine Paketdatei zurück.

Abfrageparameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig das neueste Release.
- Verwendet das Leseraten-Bucket, nicht das Download-Bucket.
- Binärdateien geben `415` zurück.
- Dateigrößenlimit: 200 KB.
- Ausstehende VirusTotal-Scans blockieren Lesevorgänge nicht; schädliche Releases können an anderer Stelle dennoch zurückgehalten werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den besitzenden Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/download`

Lädt das alte deterministische ZIP-Archiv für ein Paket-Release herunter.

Abfrageparameter:

- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig das neueste Release.
- Skills leiten zu `GET /api/v1/download` weiter.
- Plugin-/Paketarchive sind ZIP-Dateien mit einem `package/`-Root, damit alte OpenClaw
  Clients weiter funktionieren.
- Diese Route bleibt ausschließlich ZIP. Sie streamt keine ClawPack-`.tgz`-Dateien.
- Antworten enthalten die Header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` und
  `X-ClawHub-Artifact-Sha256` für Integritätsprüfungen im Resolver.
- Nur in der Registry vorhandene Metadaten werden nicht in das heruntergeladene Archiv eingefügt.
- Ausstehende VirusTotal-Scans blockieren Downloads nicht; schädliche Releases geben `403` zurück.
- Private Pakete geben `404` zurück, sofern der Aufrufer nicht der Owner ist.

### `GET /api/npm/{package}`

Gibt ein npm-kompatibles Packument für ClawPack-basierte Paketversionen zurück.

Hinweise:

- Es werden nur Versionen mit hochgeladenen ClawPack-npm-pack-Tarballs aufgelistet.
- Alte reine ZIP-Versionen werden absichtlich ausgelassen.
- `dist.tarball`, `dist.integrity` und `dist.shasum` verwenden npm-kompatible
  Felder, damit Benutzer npm bei Bedarf auf den Mirror verweisen können.
- Packuments für scoped Pakete unterstützen sowohl `/api/npm/@scope/name` als auch den von npm
  codierten Anfragepfad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt die exakt hochgeladenen ClawPack-Tarball-Bytes für npm-Mirror-Clients.

Hinweise:

- Verwendet das Download-Raten-Bucket.
- Download-Header enthalten ClawHub SHA-256 plus npm-integrity-/shasum-Metadaten.
- Moderations- und Zugriffprüfungen für private Pakete gelten weiterhin.

### `GET /api/v1/resolve`

Wird von der CLI verwendet, um einen lokalen Fingerprint einer bekannten Version zuzuordnen.

Abfrageparameter:

- `slug` (erforderlich)
- `hash` (erforderlich): 64-stelliges hex sha256 des Bundle-Fingerprints

Antwort:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Lädt eine gehostete Skill-Versions-ZIP herunter oder gibt eine Übergabe an eine GitHub-Quelle für einen
aktuellen GitHub-basierten Skill mit einem `clean`- oder `suspicious`-Scan und ohne gehostete
Version zurück.

Abfrageparameter:

- `slug` (erforderlich)
- `version` (optional): semver-Zeichenfolge
- `tag` (optional): Tag-Name (z. B. `latest`)

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Vorläufig gelöschte Versionen geben `410` zurück.
- Übergaben für GitHub-basierte Skills proxyn oder spiegeln keine Bytes. Die JSON-Antwort
  enthält `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  und `archiveUrl`; Scan-/aktueller Zustand ist ein Gate und wird nicht als Metadaten der Erfolgs-Payload
  aufgenommen.
- Download-Statistiken werden als eindeutige Identitäten pro UTC-Tag gezählt (`userId`, wenn das API-Token gültig ist, andernfalls IP).

## Authentifizierungsendpunkte (Bearer-Token)

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
- Optionales Payload-Feld: `migrateOwner`. Wenn `true` mit `ownerHandle`, kann ein
  bestehender Skill zu diesem Owner verschoben werden, wenn der Akteur Admin/Owner sowohl beim
  aktuellen als auch beim Ziel-Publisher ist. Ohne dieses Opt-in werden Owner-Änderungen
  abgelehnt.

### `POST /api/v1/packages`

Veröffentlicht ein code-plugin- oder bundle-plugin-Release.

- Erfordert Bearer-Token-Authentifizierung.
- Erfordert `multipart/form-data`.
- Erlaubte Formularfelder sind `payload`, wiederholte `files`-Blobs oder eine `clawpack`-
  Tarball-Referenz. `clawpack` kann ein `.tgz`-Blob oder eine Storage-ID sein, die vom
  upload-url-Ablauf zurückgegeben wurde. Veröffentlichungen mit gestagten Storage-IDs müssen außerdem das
  `clawpackUploadTicket` enthalten, das mit dieser Upload-URL zurückgegeben wurde.
- Verwenden Sie entweder `files` oder `clawpack`, niemals beides in derselben Anfrage.
- JSON-Bodies und vom Aufrufer bereitgestellte `payload.files`- / `payload.artifact`-
  Metadaten werden abgelehnt.
- Direkte Multipart-Veröffentlichungsanfragen sind auf 18 MB begrenzt. ClawPack-Tarballs können
  den upload-url-Ablauf bis zum Tarball-Limit von 120 MB verwenden.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, dürfen nur Admins im Namen dieses Owners veröffentlichen.

Validierungs-Highlights:

- `family` muss `code-plugin` oder `bundle-plugin` sein.
- Plugin-Pakete erfordern `openclaw.plugin.json`. ClawPack-`.tgz`-Uploads müssen
  diese Datei unter `package/openclaw.plugin.json` enthalten.
- Code-Plugins erfordern `package.json`, Quell-Repo-Metadaten, Quell-Commit-
  Metadaten, Konfigurationsschema-Metadaten, `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
- Nur der `openclaw`-Org-Publisher und die persönlichen Publisher aktueller Mitglieder der
  `openclaw`-Org dürfen im `official`-Channel veröffentlichen.
- Veröffentlichungen im Auftrag anderer validieren die Berechtigung für den official-Channel weiterhin gegen das Ziel-Owner-Konto.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skill vorläufig löschen / wiederherstellen (Owner, Moderator oder Admin).

Optionaler JSON-Body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wenn vorhanden, wird `reason` als Moderationsnotiz des Skills gespeichert und in das Audit-Log kopiert.
Vom Owner veranlasste vorläufige Löschungen reservieren den Slug 30 Tage lang; danach kann der Slug von
einem anderen Publisher beansprucht werden. Die Löschantwort enthält `slugReservedUntil`, wenn dieser Ablauf gilt.
Ausblendungen durch Moderatoren/Admins und Sicherheitsentfernungen laufen nicht auf diese Weise ab.

Löschantwort:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: nicht autorisiert
- `403`: verboten
- `404`: Skill/Benutzer nicht gefunden
- `500`: interner Serverfehler

### `POST /api/v1/users/publisher`

Nur Admins. Stellt sicher, dass für einen Handle ein Org-Publisher existiert. Wenn der Handle noch auf einen
alten gemeinsamen Benutzer-/persönlichen Publisher verweist, migriert der Endpunkt ihn zuerst in einen Org-Publisher.
Für eine neu erstellte Org geben Sie `memberHandle` an; der handelnde Admin wird nicht als Mitglied hinzugefügt.
`memberRole` ist standardmäßig `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authentifizierte Self-Service-Erstellung eines Org-Publishers. Erstellt einen neuen Org-Publisher und fügt den
Aufrufer als Owner hinzu. Dieser Endpunkt migriert keine bestehenden Benutzer-/persönlichen Handles und
markiert den Publisher nicht als vertrauenswürdig/offiziell.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Gibt `409` zurück, wenn der Handle bereits von einem Publisher, Benutzer oder persönlichen Publisher verwendet wird.

### `POST /api/v1/users/reserve`

Nur Admins. Reserviert Root-Slugs und Paketnamen für einen rechtmäßigen Owner, ohne ein
Release zu veröffentlichen. Paketnamen werden zu privaten Platzhalterpaketen ohne Release-Zeilen, sodass derselbe
Owner später das echte code-plugin- oder bundle-plugin-Release unter diesem Namen veröffentlichen kann.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwort: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Nur Admins. Stellt einen persönlichen Publisher für einen verifizierten ersetzenden GitHub-OAuth-Principal
wieder her, ohne Convex-Auth-Kontozeilen zu bearbeiten. Die Anfrage muss beide unveränderlichen GitHub-
Provider-Konto-IDs benennen; veränderliche Handles werden nur als operatorseitige Absicherung verwendet.

Der Endpoint verwendet standardmäßig einen Dry-Run. Das Anwenden der Wiederherstellung erfordert `dryRun: false` und
`confirmIdentityVerified: true`, nachdem Mitarbeitende unabhängig die Kontinuität zwischen beiden
GitHub-Principals verifiziert haben. Die Wiederherstellung schlägt fail-closed fehl, wenn der aktuelle persönliche
Publisher des Zielbenutzers Skills, Pakete oder GitHub-Skill-Quellen hat.
Die Wiederherstellung migriert außerdem veraltete `ownerUserId`-Felder für die Skills des wiederhergestellten Publishers,
Skill-Slug-Aliase, Pakete, Paket-Inspector-Warnungen und abgeleitete Such-Digest-Zeilen, sodass
Direkt-Owner-Pfade mit der neuen Publisher-Autorität übereinstimmen. Eine aktive Protected-Handle-
Reservierung für den wiederhergestellten Handle wird ebenfalls dem Ersatzbenutzer neu zugewiesen, damit eine spätere
Profilsynchronisierung die konkurrierende Autorität des früheren Benutzers nicht wiederherstellen kann. Jede primäre Tabelle ist pro Apply-Transaktion auf
100 Zeilen begrenzt; größere Wiederherstellungen müssen zuerst eine fortsetzbare Owner-Migration verwenden.
GitHub-Skill-Quellen sind Publisher-scoped und werden als geprüft gemeldet, statt umgeschrieben zu werden.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints zur Owner-Slug-Verwaltung

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Hinweise:

- Beide Endpoints erfordern API-Token-Authentifizierung und funktionieren nur für den Skill-Owner.
- `rename` bewahrt den vorherigen Slug als Redirect-Alias auf.
- `merge` blendet den Quell-Eintrag aus und leitet den Quell-Slug zum Ziel-Eintrag weiter.

### Endpoints zur Eigentumsübertragung

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Response: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Response (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Antwortstruktur: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Sperrt einen Benutzer und löscht dessen eigene Skills dauerhaft (nur Moderator/Admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

oder

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

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

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Ändert den gespeicherten Grund für eine bestehende Sperre, ohne die Sperre aufzuheben oder
Inhalte wiederherzustellen (nur Admin). Standardmäßig Dry-Run, sofern `dryRun` nicht `false` ist.

Body:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

oder

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Response:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
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

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Listet oder sucht Benutzer (nur Admin).

Query-Parameter:

- `q` (optional): Suchanfrage
- `query` (optional): Alias für `q`
- `limit` (optional): maximale Ergebnisse (Standard 20, max. 200)

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

Fügt einen Stern hinzu oder entfernt ihn (Highlights). Beide Endpoints sind idempotent.

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Veraltete CLI-Endpoints (deprecated)

Für ältere CLI-Versionen weiterhin unterstützt:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Siehe `DEPRECATIONS.md` für den Entfernungsplan.

`POST /api/cli/upload-url` gibt `uploadUrl` und `uploadTicket` zurück. Paket-
Veröffentlichungen, die einen ClawPack-Tarball stagen, müssen die resultierende Storage-ID als
`clawpack` und das zurückgegebene Ticket als `clawpackUploadTicket` senden.

## Registry-Erkennung (`/.well-known/clawhub.json`)

Die CLI kann Registry-/Authentifizierungseinstellungen von der Website erkennen:

- `/.well-known/clawhub.json` (JSON, bevorzugt)
- `/.well-known/clawdhub.json` (veraltet)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Wenn Sie selbst hosten, stellen Sie diese Datei bereit (oder setzen Sie `CLAWHUB_REGISTRY` explizit; veraltet: `CLAWDHUB_REGISTRY`).
