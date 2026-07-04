---
read_when:
    - Endpunkte hinzufügen/ändern
    - Debugging von CLI-↔-Registry-Anfragen
summary: HTTP-API-Referenz (öffentliche Endpunkte + CLI-Endpunkte + Authentifizierung).
x-i18n:
    generated_at: "2026-07-04T03:41:13Z"
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

Drittanbieter-Verzeichnisse dürfen die öffentlichen Lese-Endpunkte verwenden, um ClawHub-Skills aufzulisten oder zu durchsuchen. Bitte cachen Sie Ergebnisse, beachten Sie `429`/`Retry-After`, verlinken Sie Benutzer zurück zum kanonischen ClawHub-Eintrag (`https://clawhub.ai/<owner>/skills/<slug>`) und vermeiden Sie den Eindruck, ClawHub würde die Drittanbieter-Website unterstützen. Versuchen Sie nicht, versteckte, private oder durch Moderation blockierte Inhalte außerhalb der öffentlichen API-Oberfläche zu spiegeln.

Web-Slug-Kurzformen werden über Registry-Familien hinweg aufgelöst, API-Clients sollten jedoch die von Lese-Endpunkten zurückgegebenen kanonischen URLs verwenden, statt die Routenpriorität zu rekonstruieren.

## Ratenbegrenzungen

Durchsetzungsmodell:

- Anonyme Anfragen: pro IP durchgesetzt.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Benutzer-Bucket durchgesetzt.
- Wenn das Token fehlt/ungültig ist, fällt das Verhalten auf IP-Durchsetzung zurück.
- Authentifizierte Schreib-Endpunkte sollten kein bloßes `Unauthorized` zurückgeben, wenn der Server den Grund kennt. Fehlende Tokens, ungültige/widerrufene Tokens und gelöschte/gesperrte/deaktivierte Konten sollten jeweils handlungsrelevanten Text erhalten, damit CLI-Clients Benutzern mitteilen können, was sie blockiert hat.

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
  Erfolgreiche sharded Anfragen lassen diesen Header aus, statt einen ungefähren globalen Wert zurückzugeben.
- `Retry-After`: Sekunden, die vor einem erneuten Versuch gewartet werden sollen (Verzögerung) bei `429`

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

Client-Leitlinien:

- Wenn `Retry-After` vorhanden ist, warten Sie vor dem erneuten Versuch so viele Sekunden.
- Verwenden Sie Backoff mit Jitter, um synchronisierte Wiederholungsversuche zu vermeiden.
- Wenn `Retry-After` fehlt, fallen Sie auf `RateLimit-Reset` zurück (oder berechnen Sie den Wert aus `X-RateLimit-Reset`).

IP-Quelle:

- Verwendet vertrauenswürdige Client-IP-Header, einschließlich `cf-connecting-ip`, nur wenn die Bereitstellung vertrauenswürdige weitergeleitete Header ausdrücklich aktiviert.
- ClawHub verwendet vertrauenswürdige Weiterleitungs-Header, um Client-IPs am Edge zu identifizieren.
- Wenn keine vertrauenswürdige Client-IP verfügbar ist, verwenden anonyme Anfragen Fallback-Buckets, die nur nach Art der Ratenbegrenzung abgegrenzt sind. Diese Fallback-Buckets enthalten keine vom Aufrufer bereitgestellten Pfade, Slugs, Paketnamen, Versionen, Query-Strings oder andere Artefaktparameter.

## Fehlerantworten

Öffentliche v1-Fehlerantworten sind Klartext mit `content-type: text/plain; charset=utf-8`.
Dies umfasst Validierungsfehler (`400`), fehlende öffentliche Ressourcen (`404`), Authentifizierungs- und Berechtigungsfehler (`401`/`403`), Ratenbegrenzungen (`429`) und blockierte Downloads. Clients sollten den Antworttext als menschenlesbare Zeichenfolge lesen. Unbekannte Query-Parameter werden aus Kompatibilitätsgründen ignoriert, aber erkannte Query-Parameter mit ungültigen Werten geben `400` zurück.

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

- Ergebnisse werden nach Relevanzreihenfolge zurückgegeben (Embedding-Ähnlichkeit + exakte Slug-/Namens-Token-Boosts + ein kleiner Popularitätsprior).
- Relevanz ist stärker als Popularität. Eine präzise Übereinstimmung mit einem Slug- oder Anzeigenamen-Token kann eine lockerere Übereinstimmung mit deutlich stärkerem Engagement übertreffen.
- ASCII-Text wird an Wort- und Satzzeichengrenzen tokenisiert. Zum Beispiel enthält `personal-map` ein eigenständiges `map`-Token, während `amap-jsapi-skill` `amap`, `jsapi` und `skill` enthält; die Suche nach `map` gibt `personal-map` daher eine stärkere lexikalische Übereinstimmung als `amap-jsapi-skill`.
- Popularität wird logarithmisch skaliert und gedeckelt. Skills mit hohem Engagement können niedriger ranken, wenn der Abfragetext eine schwächere Übereinstimmung ist.
- Verdächtiger oder versteckter Moderationsstatus kann einen Skill je nach Aufruferfiltern und aktuellem Moderationsstatus aus der öffentlichen Suche entfernen.

Leitlinien zur Auffindbarkeit für Publisher:

- Platzieren Sie die Begriffe, nach denen Benutzer buchstäblich suchen werden, im Anzeigenamen, in der Zusammenfassung und in den Tags. Verwenden Sie ein eigenständiges Slug-Token nur, wenn es auch eine stabile Identität ist, die Sie behalten möchten.
- Benennen Sie einen Slug nicht nur um, um eine einzelne Suchanfrage zu bedienen, es sei denn, der neue Slug ist langfristig ein besserer kanonischer Name. Alte Slugs werden zu Weiterleitungsaliasen, aber die kanonische URL, der angezeigte Slug und zukünftige Such-Digests verwenden den neuen Slug.
- Umbenennungsaliasse bewahren die Auflösung für alte URLs und Installationen, die über die Registry aufgelöst werden, aber das Suchranking basiert auf den kanonischen Skill-Metadaten, nachdem die Umbenennung indexiert wurde. Bestehende Statistiken bleiben beim Skill.
- Wenn ein Skill unerwartet unsichtbar ist, prüfen Sie zuerst den Moderationsstatus mit `clawhub inspect @owner/slug`, während Sie angemeldet sind, bevor Sie rankingbezogene Metadaten ändern.

### `GET /api/v1/skills`

Query-Parameter:

- `limit` (optional): Ganzzahl (1–200)
- `cursor` (optional): Paginierungs-Cursor für jede nicht-`trending`-Sortierung
- `sort` (optional): `updated` (Standard), `recommended` (Alias: `default`), `createdAt` (Alias: `newest`), `downloads`, `stars` (Alias: `rating`), Legacy-Installationsaliasse `installsCurrent`/`installs`/`installsAllTime` werden auf `downloads` abgebildet, `trending`
- `nonSuspiciousOnly` (optional): `true`, um verdächtige (`flagged.suspicious`) Skills auszublenden
- `nonSuspicious` (optional): Legacy-Alias für `nonSuspiciousOnly`

Ungültige `sort`-Werte geben `400` zurück.

Hinweise:

- `recommended` verwendet Engagement- und Aktualitätssignale.
- `trending` rankt nach Installationen in den letzten 7 Tagen (telemetriebasiert).
- `createdAt` ist stabil für Crawls neuer Skills; `updated` ändert sich, wenn bestehende Skills neu veröffentlicht werden.
- Wenn `nonSuspiciousOnly=true` ist, können cursorbasierte Sortierungen auf einer Seite weniger als `limit` Elemente zurückgeben, weil verdächtige Skills nach dem Abrufen der Seite herausgefiltert werden.
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

- Alte Slugs, die durch Owner-Umbenennungs-/Merge-Flows erstellt wurden, werden auf den kanonischen Skill aufgelöst.
- `metadata.os`: OS-Einschränkungen, die im Skill-Frontmatter deklariert sind (z. B. `["macos"]`, `["linux"]`). `null`, wenn nicht deklariert.
- `metadata.systems`: Nix-Systemziele (z. B. `["aarch64-darwin", "x86_64-linux"]`). `null`, wenn nicht deklariert.
- `metadata` ist `null`, wenn der Skill keine Plattformmetadaten hat.
- `moderation` wird nur einbezogen, wenn der Skill markiert ist oder der Owner ihn ansieht.

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
- Öffentliche Aufrufer erhalten `200` nur für bereits markierte sichtbare Skills.
- Beweise werden für öffentliche Aufrufer redigiert und enthalten rohe Ausschnitte nur für Owner/Moderatoren.

### `POST /api/v1/skills/{slug}/report`

Melden Sie einen Skill zur Überprüfung durch Moderatoren. Meldungen gelten auf Skill-Ebene, sind optional mit einer Version verknüpft und speisen die Skill-Meldewarteschlange.

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

Moderator-/Admin-Endpunkt für die Annahme von Skill-Meldungen.

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

Moderator-/Admin-Endpunkt zum Erledigen oder Wiedereröffnen von Skill-Meldungen.

Anfrage:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` ist für `confirmed` und `dismissed` erforderlich; es kann ausgelassen werden, wenn `status` zurück auf `open` gesetzt wird. Übergeben Sie `finalAction: "hide"` mit einer triagierten Meldung, um den Skill im selben auditierbaren Workflow auszublenden.

### `GET /api/v1/skills/{slug}/versions`

Query-Parameter:

- `limit` (optional): Ganzzahl
- `cursor` (optional): Paginierungs-Cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Gibt Versionsmetadaten + Dateiliste zurück.

- `version.security` enthält den normalisierten Scan-Verifizierungsstatus und Scanner-Details
  (VirusTotal + LLM), wenn verfügbar.

### `GET /api/v1/skills/{slug}/scan`

Gibt Details zur Verifizierung des Sicherheitsscans für eine Skill-Version zurück.

Query-Parameter:

- `version` (optional): bestimmte Versionszeichenfolge.
- `tag` (optional): eine getaggte Version auflösen (zum Beispiel `latest`).

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Enthält den normalisierten Verifizierungsstatus sowie scanner-spezifische Details.
- `security.hasScanResult` ist nur dann `true`, wenn ein Scanner ein eindeutiges Urteil erzeugt hat (`clean`, `suspicious` oder `malicious`).
- `moderation` ist eine aktuelle Moderationsmomentaufnahme auf Skill-Ebene, die aus der neuesten Version abgeleitet wird.
- Wenn Sie eine historische Version abfragen, prüfen Sie `moderation.matchesRequestedVersion` und `moderation.sourceVersion`, bevor Sie `moderation` und `security` als denselben Versionskontext behandeln.

### `POST /api/v1/skills/-/scan`

Authentifizierter Übermittlungsendpunkt für neue ClawScan-Aufträge.

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
- Veröffentlichte Scans erfordern Verwaltungszugriff als Owner/Publisher oder Moderator-/Administratorberechtigung der Plattform.
- Veröffentlichte Scans schreiben nur zurück, wenn `update: true` gesetzt ist und der Scan erfolgreich abgeschlossen wird.
- Die Antwort ist `202` mit `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scan-Aufträge sind asynchron. Manuelle Scan-Anfragen werden vor normaler Veröffentlichungs-/Backfill-Arbeit priorisiert, der Abschluss hängt jedoch weiterhin von der Worker-Verfügbarkeit ab.

### `GET /api/v1/skills/-/scan/{scanId}`

Authentifizierter Polling-Endpunkt für einen übermittelten Scan.

- Gibt den Status queued/running/succeeded/failed zurück.
- Gibt `queue.queuedAhead` und `queue.position` zurück, solange der Auftrag in der Warteschlange ist, damit Clients anzeigen können, wie viele priorisierte manuelle Scans vor der Anfrage liegen. Sehr große Warteschlangen werden begrenzt und mit `queuedAheadIsEstimate: true` gemeldet.
- Wenn verfügbar, enthält `report` die Abschnitte `clawscan`, `skillspector`, `staticAnalysis` und `virustotal`.
- Fehlgeschlagene Scan-Aufträge geben `status: "failed"` mit `lastError` zurück.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Authentifizierter Endpunkt für Berichtsarchive.

- Erfordert einen erfolgreichen Scan; nicht terminale Scans geben `409` zurück.
- Gibt eine ZIP-Datei mit `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` und `README.md` zurück.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Authentifizierter Endpunkt für gespeicherte Berichtsarchive übermittelter Versionen.

- Erfordert Verwaltungszugriff als Owner/Publisher auf den Skill oder das Plugin oder Moderator-/Administratorberechtigung der Plattform.
- Gibt gespeicherte Scan-Ergebnisse für die exakt übermittelte Version zurück, einschließlich blockierter oder ausgeblendeter Versionen.
- `kind` ist standardmäßig `skill`; verwenden Sie `kind=plugin` für Plugin-/Paket-Scans.
- Gibt dieselbe ZIP-Struktur wie Scan-Anfrage-Downloads zurück.

### `POST /api/v1/skills/-/scan/batch`

Nur für Administratoren verfügbare kanonische Route für Batch-Rescans. Sie akzeptiert dieselbe Payload-Struktur wie das Legacy-`POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Nur für Administratoren verfügbare kanonische Route für den Batch-Status. Sie akzeptiert `{ "jobIds": ["..."] }` und gibt dieselben aggregierten Zähler wie das Legacy-`POST /api/v1/skills/-/rescan-batch/status` zurück.

### `GET /api/v1/skills/{slug}/verify`

Gibt den von `clawhub skill verify` verwendeten Skill-Card-Verifizierungsumschlag zurück.

Abfrageparameter:

- `version` (optional): spezifische Versionszeichenfolge.
- `tag` (optional): löst eine getaggte Version auf (zum Beispiel `latest`).

Hinweise:

- `ok` ist nur dann `true`, wenn die ausgewählte Version eine generierte Skill Card hat, nicht durch Moderation als Malware blockiert ist und die ClawScan-Verifizierung sauber ist.
- Skill-Identität, Publisher-Identität und Metadaten der ausgewählten Version sind Felder auf oberster Umschlagebene (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), damit Shell-Automatisierung sie lesen kann, ohne verschachtelte Wrapper zu entpacken.
- `security` ist das ClawScan-/Sicherheitsurteil auf oberster Ebene. Automatisierung sollte sich an `ok`, `decision`, `reasons` und `security.status` orientieren.
- `security.signals` enthält unterstützende Scanner-Nachweise wie `staticScan`, `virusTotal` und `skillSpector`.
- `security.signals.dependencyRegistry` bleibt für die Kompatibilität der v1-Antwort erhalten, aber der Scanner zur Existenz in der Dependency Registry wurde eingestellt und dieser Schlüssel ist immer `null`.
- `provenance` ist nur dann `server-resolved-github-import`, wenn ClawHub während der Veröffentlichung oder des Imports ein GitHub-Repository/eine Ref/einen Commit/einen Pfad aufgelöst und gespeichert hat; andernfalls ist es `unavailable`.

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

- `items` muss 1 bis 100 eindeutige `{ slug, version }`-Paare enthalten.
- Ergebnisse gelten pro Element; ein fehlender Skill oder eine fehlende Version lässt nicht die gesamte Antwort fehlschlagen.
- Die Antwort ist ausschließlich sicherheitsbezogen. Sie enthält keine Skill-Card-Daten, keinen Status generierter Cards, keine Artefakt-Dateilisten und keine detaillierten Scanner-Payloads.
- `security.signals` enthält nur unterstützende Nachweise auf Statusebene; verwenden Sie `/scan` oder die ClawHub-Seite security-audit für vollständige Scanner-Details.
- `security.signals.dependencyRegistry` bleibt für die Kompatibilität der v1-Antwort erhalten, aber der Scanner zur Existenz in der Dependency Registry wurde eingestellt und dieser Schlüssel ist immer `null`.
- Das Fehlen einer Skill Card beeinflusst `ok`, `decision` oder `reasons` dieses Endpunkts nicht; Clients sollten installiertes `skill-card.md` lokal lesen, wenn sie Card-Inhalte benötigen.
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

Gibt Rohtextinhalte zurück.

Abfrageparameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig die neueste Version.
- Dateigrößenlimit: 200 KB.

### `GET /api/v1/packages`

Einheitlicher Katalog-Endpunkt für:

- Skills
- Code-Plugins
- Bundle-Plugins

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungscursor
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `sort` (optional): `updated` (Standard), `recommended`, `trending`, `downloads`, Legacy-Alias `installs`
- `category` (optional): Plugin-Kategoriefilter. Nur unterstützt, wenn der
  Request auf Plugin-Pakete beschränkt ist (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` oder Paket-Endpunkte mit
  `family=code-plugin`/`family=bundle-plugin`). Kontrollierte Kategorien und
  Legacy-v1-Filteraliase sind unter `GET /api/v1/plugins` dokumentiert.

Hinweise:

- Ungültige Werte für `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` oder `sort` geben `400` zurück. Unbekannte Abfrageparameter werden ignoriert.
- `GET /api/v1/code-plugins` und `GET /api/v1/bundle-plugins` bleiben Fixed-Family-Aliase.
- Skill-Einträge bleiben durch die Skill-Registry gestützt und können weiterhin nur über `POST /api/v1/skills` veröffentlicht werden.
- `POST /api/v1/packages` ist weiterhin nur für Code-Plugin- und Bundle-Plugin-Releases vorgesehen.
- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können in Listen-/Suchergebnissen private Pakete für Publisher sehen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.

### `GET /api/v1/packages/search`

Einheitliche Katalogsuche über Skills und Plugin-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl (1–100)
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `category` (optional): Plugin-Kategoriefilter. Nur unterstützt, wenn der
  Request auf Plugin-Pakete beschränkt ist. Kontrollierte Kategorien und
  Legacy-v1-Filteraliase sind unter `GET /api/v1/plugins` dokumentiert.

Hinweise:

- Ungültige Werte für `family`, `channel`, `isOfficial`, `featured` oder
  `highlightedOnly` geben `400` zurück. Unbekannte Abfrageparameter werden ignoriert.
- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können private Pakete für Publisher suchen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.

### `GET /api/v1/plugins`

Nur-Plugin-Katalog-Browsing über Code-Plugin- und Bundle-Plugin-Pakete hinweg.

Abfrageparameter:

- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungscursor
- `isOfficial` (optional): `true` oder `false`
- `sort` (optional): `recommended` (Standard), `trending`, `downloads`, `updated`, Legacy-Alias `installs`
- `category` (optional): Plugin-Kategoriefilter. Aktuelle Werte:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Legacy-v1-Filteraliase werden auf Lese-Endpunkten weiterhin akzeptiert:

- `mcp-tooling`, `data` und `automation` werden zu `tools` aufgelöst.
- `observability` und `deployment` werden zu `gateway` aufgelöst.
- `dev-tools` wird zu `runtime` aufgelöst.

`trending` ist eine Sieben-Tage-Installations-/Download-Bestenliste und verwendet keine Gesamtwerte über alle Zeiten.
Auf dem einheitlichen Endpunkt `/api/v1/packages` ist dies nur für Plugins vorgesehen; verwenden Sie
`/api/v1/skills?sort=trending` für den Skill-Katalog.

Legacy-Aliase werden nicht als gespeicherte oder von Autoren deklarierte Kategoriewerte akzeptiert.

### `GET /api/v1/skills/export`

Massenexport der neuesten öffentlichen Skills für die Offline-Analyse.

Auth:

- API-Token erforderlich.

Abfrageparameter:

- `startDate` (erforderlich): Unix-Millisekunden als untere Grenze für `updatedAt` des Skills.
- `endDate` (erforderlich): Unix-Millisekunden als obere Grenze für `updatedAt` des Skills.
- `limit` (optional): Ganzzahl (1-250), Standard `250`.
- `cursor` (optional): Paginierungscursor aus der vorherigen Antwort.

Antwort:

- Body: ZIP-Archiv.
- Jeder exportierte Skill hat sein Stammverzeichnis unter `{publisher}/{slug}/`.
- Gehostete Skills enthalten die neuesten gespeicherten Versionsdateien und werden in
  `_manifest.json` mit `sourceRef: "public-clawhub"` aufgeführt.
- Aktuelle GitHub-gestützte Skills mit einem Scanstatus `clean` oder `suspicious` enthalten
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
- `family` (optional): `code-plugin` oder `bundle-plugin`. Wenn ausgelassen, sind beide
  Plugin-Familien gemeint.

Antwort:

- Body: ZIP-Archiv.
- Jedes exportierte Plugin hat sein Stammverzeichnis unter `{family}/{packageName}/`.
- Jedes exportierte Plugin enthält die gespeicherten Dateien des neuesten Releases.
- Exportmetadaten pro Plugin werden gespeichert unter
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` ist immer im ZIP-Stammverzeichnis enthalten.
- `_errors.json` ist enthalten, wenn einzelne Plugins oder Dateien nicht
  exportiert werden konnten.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Plugin-spezifische Suche über code-plugin- und bundle-plugin-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Suchzeichenfolge
- `limit` (optional): Ganzzahl (1-100)
- `isOfficial` (optional): `true` oder `false`
- `category` (optional): Filter für Plugin-Kategorien. Aktuelle Werte:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Hinweise:

- Die veralteten v1-Filteraliase, die unter `GET /api/v1/plugins` dokumentiert sind, werden ebenfalls
  akzeptiert.
- Kategoriefilterung ist ein echter API-Filter, der durch Plugin-Kategorie-Digest-
  Zeilen gestützt wird, keine Umschreibung der Suchabfrage.
- Ergebnisse werden nach Relevanz sortiert zurückgegeben und unterstützen derzeit keine Paginierung.
- Sortiersteuerelemente der Browser-UI für die Plugin-Suche ordnen die geladenen Relevanzergebnisse neu,
  entsprechend dem aktuellen Browse-Verhalten von `/skills`.

### `GET /api/v1/packages/{name}`

Gibt Detailmetadaten zum Paket zurück.

Hinweise:

- Skills können im vereinheitlichten Katalog ebenfalls über diese Route aufgelöst werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Publisher nicht lesen kann.

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

- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/versions/{version}`

Gibt eine Paketversion zurück, einschließlich Dateimetadaten, Kompatibilität,
Verifizierung, Artefaktmetadaten und Scan-Daten.

Hinweise:

- `version.artifact.kind` ist `legacy-zip` für Paketarchive der alten Welt oder
  `npm-pack` für ClawPack-gestützte Releases.
- ClawPack-Releases enthalten npm-kompatible Felder `npmIntegrity`, `npmShasum` und
  `npmTarballName`.
- `version.sha256hash` sind veraltete Kompatibilitätsmetadaten für alte Clients. Sie
  hashen die exakten ZIP-Bytes, die von `/api/v1/packages/{name}/download` zurückgegeben werden.
  Moderne Clients sollten `version.artifact.sha256` verwenden, das das
  kanonische Release-Artefakt identifiziert.
- `version.vtAnalysis`, `version.llmAnalysis` und `version.staticScan` sind
  enthalten, wenn Scan-Daten vorhanden sind.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Publisher nicht lesen kann.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Gibt die exakte Sicherheits- und Vertrauenszusammenfassung eines Paket-Releases für Installations-
Clients zurück. Dies ist die öffentliche OpenClaw-Nutzungsoberfläche zur Entscheidung, ob ein
aufgelöstes Release installiert werden kann.

Authentifizierung:

- Öffentlicher Lese-Endpunkt. Kein Eigentümer-, Publisher-, Moderator- oder Admin-Token ist
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
- `trust.blockedFromDownload` ist das Signal für die Installationssperre. OpenClaw und andere
  Installations-Clients sollten die Installation blockieren, wenn dieser Wert `true` ist, anstatt
  Sperrregeln aus Scanner- oder Moderationsfeldern erneut abzuleiten.
- `trust.reasons` ist die Liste der nutzerseitigen und auditierbaren Erklärungen. Reason-Codes
  sind stabile, kompakte Zeichenfolgen wie `manual:quarantined`, `scan:malicious`
  und `package:malicious`.
- `trust.pending` bedeutet, dass eine oder mehrere Vertrauenseingaben noch auf Abschluss warten.
- `trust.stale` bedeutet, dass die Vertrauenszusammenfassung aus veralteten Eingaben berechnet wurde und
  vor einer Allow-Entscheidung mit hoher Sicherheit als aktualisierungsbedürftig behandelt werden sollte.

Hinweise:

- Dieser Endpunkt ist versionsexakt. Clients sollten ihn aufrufen, nachdem sie die
  Paketversion aufgelöst haben, die sie installieren möchten, nicht nur nach dem Lesen der neuesten
  Paketmetadaten.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Publisher nicht lesen kann.
- Dieser Endpunkt ist absichtlich enger gefasst als Moderationsendpunkte für Eigentümer/Moderatoren.
  Er macht die Installationsentscheidung und die öffentliche Erklärung sichtbar, nicht
  Reporter-Identitäten, Report-Inhalte, private Belege oder interne Review-
  Zeitpläne.

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

- ClawPack-Versionen streamen die exakt hochgeladenen npm-pack-`.tgz`-Bytes.
- Legacy-ZIP-Versionen leiten zu `/api/v1/packages/{name}/download?version=` weiter.
- Verwendet den Download-Rate-Bucket.

### `GET /api/v1/packages/{name}/readiness`

Gibt die berechnete Bereitschaft für zukünftige OpenClaw-Nutzung zurück.

Bereitschaftsprüfungen umfassen:

- Status als offizieller Kanal
- Verfügbarkeit der neuesten Version
- Verfügbarkeit des ClawPack-npm-pack-Artefakts
- Artefakt-Digest
- Source-Repo- und Commit-Herkunft
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
- `packageName` wird als npm-Name normalisiert; das Paket kann bei geplanten
  Migrationen fehlen.
- Dies verfolgt nur die Migrationsbereitschaft. Es verändert OpenClaw nicht und generiert keine
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/Admin-Endpunkt für Paket-Release-Review-Warteschlangen.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator- oder Admin-Benutzer.

Abfrageparameter:

- `status` (optional): `open` (Standardwert), `blocked`, `manual` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungs-Cursor

Statusbedeutungen:

- `open`: verdächtige, schädliche, ausstehende, quarantänisierte, widerrufene oder gemeldete Releases.
- `blocked`: quarantänisierte, widerrufene oder schädliche Releases.
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

Meldet ein Paket zur Moderator-Prüfung. Reports gelten auf Paketebene und sind optional
mit einer Version verknüpft. Sie fließen in die Moderationswarteschlange ein, blenden aber selbst keine
Downloads automatisch aus und blockieren sie nicht; Moderatoren sollten Release-Moderation verwenden, um
Artefakte zu genehmigen, zu quarantänisieren oder zu widerrufen.

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

### `GET /api/v1/packages/reports`

Moderator-/Admin-Endpunkt für die Annahme von Paketmeldungen.

Auth:

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

Auth:

- Erfordert ein API-Token für den Paketeigentümer, ein Herausgeber-Mitglied,
  einen Moderator oder einen Admin-Benutzer.

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

Moderator-/Admin-Endpunkt zum Erledigen oder erneuten Öffnen von Paketmeldungen.

Anfrage:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` ist für `confirmed` und `dismissed` erforderlich; es kann weggelassen
werden, wenn `status` wieder auf `open` gesetzt wird. Übergeben Sie
`finalAction: "quarantine"` oder `finalAction: "revoke"` mit einer bestätigten
Meldung, um Release-Moderation im selben auditierbaren Workflow anzuwenden.

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

- `approved`: manuell geprüft und zugelassen.
- `quarantined`: bis zur Nachverfolgung blockiert.
- `revoked`: blockiert, nachdem einem Release zuvor vertraut wurde.

Unter Quarantäne gestellte und widerrufene Releases geben bei Artifact-Download-Routen `403` zurück.
Jede Änderung schreibt einen Audit-Log-Eintrag.

### `GET /api/v1/packages/{name}/file`

Gibt Rohtextinhalt für eine Paketdatei zurück.

Abfrageparameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Standardmäßig wird das neueste Release verwendet.
- Verwendet den Read-Rate-Bucket, nicht den Download-Bucket.
- Binärdateien geben `415` zurück.
- Dateigrößenlimit: 200 KB.
- Ausstehende VirusTotal-Scans blockieren Lesevorgänge nicht; bösartige Releases können an anderer Stelle dennoch zurückgehalten werden.
- Private Pakete geben `404` zurück, es sei denn, der Aufrufer kann den besitzenden Herausgeber lesen.

### `GET /api/v1/packages/{name}/download`

Lädt das ältere deterministische ZIP-Archiv für ein Paket-Release herunter.

Abfrageparameter:

- `version` (optional)
- `tag` (optional)

Hinweise:

- Standardmäßig wird das neueste Release verwendet.
- Skills leiten zu `GET /api/v1/download` weiter.
- Plugin-/Paketarchive sind ZIP-Dateien mit einem `package/`-Stamm, damit ältere
  OpenClaw-Clients weiter funktionieren.
- Diese Route bleibt ausschließlich ZIP-basiert. Sie streamt keine ClawPack-`.tgz`-Dateien.
- Antworten enthalten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- und
  `X-ClawHub-Artifact-Sha256`-Header für Integritätsprüfungen durch Resolver.
- Reine Registry-Metadaten werden nicht in das heruntergeladene Archiv injiziert.
- Ausstehende VirusTotal-Scans blockieren Downloads nicht; bösartige Releases geben `403` zurück.
- Private Pakete geben `404` zurück, es sei denn, der Aufrufer ist der Eigentümer.

### `GET /api/npm/{package}`

Gibt ein npm-kompatibles Packument für ClawPack-gestützte Paketversionen zurück.

Hinweise:

- Es werden nur Versionen mit hochgeladenen ClawPack-npm-pack-Tarballs aufgeführt.
- Ältere reine ZIP-Versionen werden absichtlich ausgelassen.
- `dist.tarball`, `dist.integrity` und `dist.shasum` verwenden npm-kompatible
  Felder, damit Benutzer npm bei Bedarf auf den Spiegel verweisen können.
- Packuments für scoped Pakete unterstützen sowohl `/api/npm/@scope/name` als auch
  den von npm codierten Anfragepfad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt die exakt hochgeladenen ClawPack-Tarball-Bytes für npm-Spiegel-Clients.

Hinweise:

- Verwendet den Download-Rate-Bucket.
- Download-Header enthalten ClawHub-SHA-256 sowie npm-Integritäts-/shasum-Metadaten.
- Moderations- und Zugriffsprüfungen für private Pakete gelten weiterhin.

### `GET /api/v1/resolve`

Wird von der CLI verwendet, um einen lokalen Fingerprint einer bekannten Version zuzuordnen.

Abfrageparameter:

- `slug` (erforderlich)
- `hash` (erforderlich): 64-Zeichen-Hex-SHA-256 des Bundle-Fingerprints

Antwort:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Lädt ein gehostetes Skill-Versions-ZIP herunter oder gibt eine GitHub-Quellübergabe für einen
aktuellen GitHub-gestützten Skill mit einem `clean`- oder `suspicious`-Scan und ohne gehostete
Version zurück.

Abfrageparameter:

- `slug` (erforderlich)
- `version` (optional): Semver-Zeichenfolge
- `tag` (optional): Tag-Name (z. B. `latest`)

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Soft-deleted Versionen geben `410` zurück.
- GitHub-gestützte Skill-Übergaben proxyn oder spiegeln keine Bytes. Die JSON-Antwort
  enthält `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  und `archiveUrl`; Scan-/aktueller Zustand ist ein Gate und wird nicht als Erfolgs-
  Payload-Metadaten eingeschlossen.
- Download-Statistiken werden als eindeutige Identitäten pro UTC-Tag gezählt (`userId`, wenn das API-Token gültig ist, andernfalls IP).

## Auth-Endpunkte (Bearer token)

Alle Endpunkte erfordern:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Validiert das Token und gibt das Benutzer-Handle zurück.

### `POST /api/v1/skills`

Veröffentlicht eine neue Version.

- Bevorzugt: `multipart/form-data` mit `payload`-JSON + `files[]`-Blobs.
- JSON-Body mit `files` (storageId-basiert) wird ebenfalls akzeptiert.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, löst die API diesen
  Herausgeber serverseitig auf und verlangt, dass der Akteur Herausgeberzugriff hat.
- Optionales Payload-Feld: `migrateOwner`. Wenn `true` mit `ownerHandle`, kann ein
  vorhandener Skill zu diesem Eigentümer verschoben werden, wenn der Akteur Admin/Eigentümer
  bei sowohl dem aktuellen als auch dem Ziel-Herausgeber ist. Ohne dieses Opt-in werden
  Eigentümeränderungen abgelehnt.

### `POST /api/v1/packages`

Veröffentlicht ein code-plugin- oder bundle-plugin-Release.

- Erfordert Authentifizierung per Bearer token.
- Erfordert `multipart/form-data`.
- Zulässige Formularfelder sind `payload`, wiederholte `files`-Blobs oder eine
  `clawpack`-Tarball-Referenz. `clawpack` kann ein `.tgz`-Blob oder eine Storage-ID sein,
  die vom Upload-URL-Flow zurückgegeben wurde. Veröffentlichungen mit bereitgestellter
  Storage-ID müssen außerdem das mit dieser Upload-URL zurückgegebene
  `clawpackUploadTicket` enthalten.
- Verwenden Sie entweder `files` oder `clawpack`, niemals beides in derselben Anfrage.
- JSON-Bodys und vom Aufrufer bereitgestellte `payload.files`- / `payload.artifact`-
  Metadaten werden abgelehnt.
- Direkte Multipart-Veröffentlichungsanfragen sind auf 18 MB begrenzt. ClawPack-Tarballs können
  den Upload-URL-Flow bis zur Tarball-Obergrenze von 120 MB verwenden.
- Optionales Payload-Feld: `ownerHandle`. Wenn vorhanden, dürfen nur Admins im Namen dieses Eigentümers veröffentlichen.

Validierungshighlights:

- `family` muss `code-plugin` oder `bundle-plugin` sein.
- Plugin-Pakete erfordern `openclaw.plugin.json`. ClawPack-`.tgz`-Uploads müssen
  sie unter `package/openclaw.plugin.json` enthalten.
- Code-Plugins erfordern `package.json`, Quell-Repo-Metadaten, Quell-Commit-
  Metadaten, Konfigurationsschema-Metadaten, `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
- Nur der `openclaw`-Org-Herausgeber und die persönlichen Herausgeber aktueller
  `openclaw`-Org-Mitglieder dürfen im `official`-Kanal veröffentlichen.
- Veröffentlichungen im Namen anderer validieren die Berechtigung für den official-Kanal weiterhin gegen das Ziel-Eigentümerkonto.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / Wiederherstellung eines Skills (Eigentümer, Moderator oder Admin).

Optionaler JSON-Body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wenn vorhanden, wird `reason` als Skill-Moderationsnotiz gespeichert und in das Audit-Log kopiert.
Vom Eigentümer initiierte Soft Deletes reservieren den Slug für 30 Tage; danach kann der Slug von
einem anderen Herausgeber beansprucht werden. Die Löschantwort enthält `slugReservedUntil`, wenn dieses Ablaufdatum gilt.
Ausblendungen durch Moderator/Admin und sicherheitsbedingte Entfernungen laufen auf diese Weise nicht ab.

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

Nur Admin. Stellt sicher, dass ein Org-Herausgeber für ein Handle existiert. Wenn das Handle noch auf einen
älteren gemeinsam genutzten Benutzer-/persönlichen Herausgeber verweist, migriert der Endpunkt es zuerst in einen Org-Herausgeber.
Geben Sie für eine neu erstellte Org `memberHandle` an; der handelnde Admin wird nicht als Mitglied hinzugefügt.
`memberRole` ist standardmäßig `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authentifizierte Self-Service-Erstellung eines Org-Herausgebers. Erstellt einen neuen Org-Herausgeber und fügt den
Aufrufer als Eigentümer hinzu. Dieser Endpunkt migriert keine vorhandenen Benutzer-/persönlichen Handles und markiert
den Herausgeber nicht als trusted/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Gibt `409` zurück, wenn das Handle bereits von einem Herausgeber, Benutzer oder persönlichen Herausgeber verwendet wird.

### `POST /api/v1/users/reserve`

Nur Admin. Reserviert Root-Slugs und Paketnamen für einen rechtmäßigen Eigentümer, ohne ein
Release zu veröffentlichen. Paketnamen werden zu privaten Platzhalterpaketen ohne Release-Zeilen, sodass derselbe
Eigentümer später das echte code-plugin- oder bundle-plugin-Release unter diesem Namen veröffentlichen kann.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwort: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Nur Admin. Stellt einen persönlichen Herausgeber für einen verifizierten Ersatz-GitHub-OAuth-Principal wieder her,
ohne Convex-Auth-Kontozeilen zu bearbeiten. Die Anfrage muss beide unveränderlichen GitHub-
Provider-Konto-IDs benennen; veränderliche Handles werden nur als operatorseitige Schutzprüfung verwendet.

Der Endpunkt verwendet standardmäßig Dry-Run. Das Anwenden der Wiederherstellung erfordert `dryRun: false` und
`confirmIdentityVerified: true`, nachdem Mitarbeitende die Kontinuität zwischen beiden
GitHub-Principals unabhängig verifiziert haben. Die Wiederherstellung schlägt geschlossen fehl, wenn der aktuelle persönliche
Publisher des Zielbenutzers Skills, Pakete oder GitHub-Skill-Quellen hat.
Die Wiederherstellung migriert außerdem ältere `ownerUserId`-Felder für die Skills des wiederhergestellten Publishers,
Skill-Slug-Aliase, Pakete, Package-Inspector-Warnungen und abgeleitete Such-Digest-Zeilen, damit
Direct-Owner-Pfade mit der neuen Publisher-Autorität übereinstimmen. Eine aktive geschützte Handle-Reservierung
für das wiederhergestellte Handle wird ebenfalls dem Ersatzbenutzer neu zugewiesen, damit eine spätere
Profilsynchronisierung die konkurrierende Autorität des früheren Benutzers nicht wiederherstellen kann. Jede Primärtabelle ist pro
Apply-Transaktion auf 100 Zeilen begrenzt; größere Wiederherstellungen müssen zuerst eine fortsetzbare Owner-Migration verwenden.
GitHub-Skill-Quellen sind Publisher-bezogen und werden als geprüft gemeldet, statt umgeschrieben zu werden.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Antwort: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner-Slug-Verwaltungsendpunkte

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwort: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwort: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Hinweise:

- Beide Endpunkte erfordern API-Token-Authentifizierung und funktionieren nur für den Skill-Owner.
- `rename` behält den vorherigen Slug als Weiterleitungsalias bei.
- `merge` blendet das Quell-Listing aus und leitet den Quell-Slug zum Ziel-Listing weiter.

### Endpunkte zur Eigentumsübertragung

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

Antwort:

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

Antwort:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Listet Benutzer auf oder sucht nach ihnen (nur Admin).

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

Fügt einen Stern hinzu oder entfernt ihn (Highlights). Beide Endpunkte sind idempotent.

Antworten:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy-CLI-Endpunkte (veraltet)

Werden für ältere CLI-Versionen weiterhin unterstützt:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Siehe `DEPRECATIONS.md` für den Entfernungsplan.

`POST /api/cli/upload-url` gibt `uploadUrl` und `uploadTicket` zurück. Package-
Veröffentlichungen, die einen ClawPack-Tarball bereitstellen, müssen die resultierende Storage-ID als
`clawpack` und das zurückgegebene Ticket als `clawpackUploadTicket` senden.

## Registry-Erkennung (`/.well-known/clawhub.json`)

Die CLI kann Registry-/Auth-Einstellungen von der Website erkennen:

- `/.well-known/clawhub.json` (JSON, bevorzugt)
- `/.well-known/clawdhub.json` (Legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Wenn Sie selbst hosten, stellen Sie diese Datei bereit (oder setzen Sie `CLAWHUB_REGISTRY` explizit; Legacy `CLAWDHUB_REGISTRY`).
