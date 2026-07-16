---
read_when:
    - Endpunkte hinzufügen/ändern
    - Debugging von CLI-↔-Registry-Anfragen
summary: HTTP-API-Referenz (öffentliche Endpunkte + CLI-Endpunkte + Authentifizierung).
x-i18n:
    generated_at: "2026-07-16T12:33:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (Standard).

Alle v1-Pfade befinden sich unter `/api/v1/...`.
Die veralteten Pfade `/api/...` und `/api/cli/...` bleiben aus Kompatibilitätsgründen erhalten (siehe `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Wiederverwendung des öffentlichen Katalogs

Verzeichnisse von Drittanbietern dürfen die öffentlichen Lese-Endpunkte verwenden, um ClawHub-Skills aufzulisten oder zu durchsuchen. Zwischenspeichern Sie Ergebnisse, beachten Sie `429`/`Retry-After`, verlinken Sie Benutzer zurück zum kanonischen ClawHub-Eintrag (`https://clawhub.ai/<owner>/skills/<slug>`) und vermeiden Sie den Eindruck, ClawHub unterstütze die Drittanbieter-Website. Versuchen Sie nicht, verborgene, private oder durch die Moderation gesperrte Inhalte außerhalb der öffentlichen API-Oberfläche zu spiegeln.

Web-Slug-Kurzformen werden über Registry-Familien hinweg aufgelöst, API-Clients sollten jedoch die von Lese-Endpunkten zurückgegebenen kanonischen URLs verwenden, anstatt die Routenpriorität zu rekonstruieren.

## Ratenbegrenzungen

Durchsetzungsmodell:

- Anonyme Anfragen: Durchsetzung pro IP.
- Authentifizierte Anfragen (gültiges Bearer-Token): Durchsetzung pro Benutzerkontingent.
- Wenn das Token fehlt oder ungültig ist, wird ersatzweise die Durchsetzung pro IP verwendet.
- Authentifizierte Schreib-Endpunkte sollten nicht nur `Unauthorized` zurückgeben, wenn
  dem Server der Grund bekannt ist. Fehlende Tokens, ungültige/widerrufene Tokens und
  gelöschte/gesperrte/deaktivierte Konten sollten jeweils einen aussagekräftigen Text erhalten, damit CLI-
  Clients den Benutzern mitteilen können, wodurch sie blockiert wurden.

- Lesen: 3000/min pro IP, 12000/min pro Schlüssel
- Schreiben: 300/min pro IP, 3000/min pro Schlüssel
- Download: 1200/min pro IP, 6000/min pro Schlüssel (Download-Endpunkte)

Header:

- Abwärtskompatibilität: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardisiert: `RateLimit-Limit`, `RateLimit-Reset`
- Bei `429`: `X-RateLimit-Remaining: 0` und `RateLimit-Remaining: 0`
- Bei `429`: `Retry-After`

Header-Semantik:

- `X-RateLimit-Reset`: absolute Sekunden seit der Unix-Epoche
- `RateLimit-Reset`: Sekunden bis zum Zurücksetzen (Verzögerung)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: genaues verbleibendes Kontingent, sofern vorhanden.
  Bei erfolgreichen Shard-Anfragen wird dieser Header ausgelassen, statt einen ungefähren globalen Wert zurückzugeben.
- `Retry-After`: Wartezeit in Sekunden vor einem erneuten Versuch (Verzögerung) bei `429`

Beispielantwort für `429`:

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

Ratenbegrenzung überschritten
```

Hinweise für Clients:

- Wenn `Retry-After` vorhanden ist, warten Sie vor dem erneuten Versuch entsprechend viele Sekunden.
- Verwenden Sie eine zufällig variierte exponentielle Wartezeit, um synchronisierte Wiederholungsversuche zu vermeiden.
- Wenn `Retry-After` fehlt, greifen Sie auf `RateLimit-Reset` zurück (oder berechnen Sie den Wert anhand von `X-RateLimit-Reset`).

IP-Quelle:

- Vertrauenswürdige Client-IP-Header einschließlich `cf-connecting-ip` werden nur verwendet, wenn die
  Bereitstellung vertrauenswürdige Weiterleitungs-Header ausdrücklich aktiviert.
- ClawHub verwendet vertrauenswürdige Weiterleitungs-Header, um Client-IPs am Netzwerkrand zu identifizieren.
- Wenn keine vertrauenswürdige Client-IP verfügbar ist, verwenden anonyme Anfragen Ausweichkontingente,
  deren Gültigkeitsbereich ausschließlich auf die Art der Ratenbegrenzung beschränkt ist. Diese Ausweichkontingente enthalten keine
  vom Aufrufer bereitgestellten Pfade, Slugs, Paketnamen, Versionen, Abfragezeichenfolgen oder anderen
  Artefaktparameter.

## Fehlerantworten

Öffentliche v1-Fehlerantworten sind Klartext mit `content-type: text/plain; charset=utf-8`.
Dies umfasst Validierungsfehler (`400`), fehlende öffentliche Ressourcen (`404`), Authentifizierungs- und
Berechtigungsfehler (`401`/`403`), Ratenbegrenzungen (`429`) und blockierte Downloads. Clients
sollten den Antworttext als menschenlesbare Zeichenfolge behandeln. Unbekannte Abfrageparameter werden
aus Kompatibilitätsgründen ignoriert, erkannte Abfrageparameter mit ungültigen Werten geben jedoch
`400` zurück.

## Öffentliche Endpunkte (keine Authentifizierung)

### `GET /api/v1/search`

Abfrageparameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl
- `highlightedOnly` (optional): `true`, um nach hervorgehobenen Skills zu filtern
- `nonSuspiciousOnly` (optional): `true`, um verdächtige (`flagged.suspicious`) Skills auszublenden
- `nonSuspicious` (optional): veralteter Alias für `nonSuspiciousOnly`

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

- Ergebnisse werden nach Relevanz sortiert zurückgegeben (Einbettungsähnlichkeit + Verstärkungen für exakte Slug-/Namenstoken + eine geringe vorherige Popularitätsgewichtung).
- Relevanz wird stärker gewichtet als Popularität. Eine genaue Übereinstimmung mit einem Slug- oder Anzeigenamen-Token kann höher eingestuft werden als eine ungenauere Übereinstimmung mit deutlich höherer Interaktion.
- ASCII-Text wird an Wort- und Satzzeichengrenzen tokenisiert. Beispielsweise enthält `personal-map` ein eigenständiges `map`-Token, während `amap-jsapi-skill` die Tokens `amap`, `jsapi` und `skill` enthält; eine Suche nach `map` ergibt daher für `personal-map` eine stärkere lexikalische Übereinstimmung als für `amap-jsapi-skill`.
- Die Popularität wird logarithmisch skaliert und begrenzt. Skills mit hoher Interaktion können niedriger eingestuft werden, wenn der Abfragetext weniger gut übereinstimmt.
- Ein verdächtiger oder verborgener Moderationsstatus kann einen Skill abhängig von den Filtern des Aufrufers und dem aktuellen Moderationsstatus aus der öffentlichen Suche entfernen.

Hinweise zur Auffindbarkeit für Herausgeber:

- Nehmen Sie die Begriffe, nach denen Benutzer tatsächlich suchen werden, in den Anzeigenamen, die Zusammenfassung und die Tags auf. Verwenden Sie nur dann ein eigenständiges Slug-Token, wenn es zugleich eine stabile Identität darstellt, die Sie beibehalten möchten.
- Benennen Sie einen Slug nicht nur deshalb um, um eine einzelne Suchanfrage zu bedienen, es sei denn, der neue Slug ist langfristig ein besserer kanonischer Name. Alte Slugs werden zu Weiterleitungsaliasen, aber die kanonische URL, der angezeigte Slug und zukünftige Suchzusammenfassungen verwenden den neuen Slug.
- Umbenennungsaliase gewährleisten weiterhin die Auflösung alter URLs und von Installationen, die über die Registry aufgelöst werden. Das Suchranking basiert jedoch auf den kanonischen Skill-Metadaten, nachdem die Umbenennung indiziert wurde. Bestehende Statistiken verbleiben beim Skill.
- Wenn ein Skill unerwartet nicht sichtbar ist, prüfen Sie im angemeldeten Zustand zunächst den Moderationsstatus mit `clawhub inspect @owner/slug`, bevor Sie für das Ranking relevante Metadaten ändern.

### `GET /api/v1/skills`

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–200)
- `cursor` (optional): Paginierungscursor für jede Sortierung außer `trending`
- `sort` (optional): `updated` (Standard), `recommended` (Alias: `default`), `createdAt` (Alias: `newest`), `downloads`, `stars` (Alias: `rating`), die veralteten Installationsaliase `installsCurrent`/`installs`/`installsAllTime` werden auf `downloads` abgebildet, `trending`
- `nonSuspiciousOnly` (optional): `true`, um verdächtige (`flagged.suspicious`) Skills auszublenden
- `nonSuspicious` (optional): veralteter Alias für `nonSuspiciousOnly`

Ungültige Werte für `sort` geben `400` zurück.

Hinweise:

- `recommended` verwendet Interaktions- und Aktualitätssignale.
- `trending` sortiert nach Installationen innerhalb der letzten 7 Tage (telemetriebasiert).
- `createdAt` ist für das Crawlen neuer Skills stabil; `updated` ändert sich, wenn bestehende Skills erneut veröffentlicht werden.
- Wenn `nonSuspiciousOnly=true`, können cursorbasierte Sortierungen weniger als `limit` Elemente auf einer Seite zurückgeben, da verdächtige Skills nach dem Abruf der Seite herausgefiltert werden.
- Verwenden Sie `nextCursor`, sofern vorhanden, um die Paginierung fortzusetzen. Eine kurze Seite bedeutet für sich genommen nicht das Ende der Ergebnisse.

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

- Alte Slugs, die durch Umbenennungs-/Zusammenführungsabläufe des Eigentümers erstellt wurden, werden zum kanonischen Skill aufgelöst.
- `metadata.os`: im Frontmatter des Skills deklarierte Betriebssystemeinschränkungen (z. B. `["macos"]`, `["linux"]`). `null`, wenn nicht deklariert.
- `metadata.systems`: Nix-Systemziele (z. B. `["aarch64-darwin", "x86_64-linux"]`). `null`, wenn nicht deklariert.
- `metadata` ist `null`, wenn der Skill keine Plattformmetadaten besitzt.
- `moderation` wird nur einbezogen, wenn der Skill markiert ist oder der Eigentümer ihn anzeigt.

### `GET /api/v1/skills/{slug}/moderation`

Gibt einen strukturierten Moderationsstatus zurück.

Antwort:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Erkannt: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamische Codeausführung erkannt.",
        "evidence": ""
      }
    ]
  }
}
```

Hinweise:

- Eigentümer und Moderatoren können auf Moderationsdetails für verborgene Skills zugreifen.
- Öffentliche Aufrufer erhalten `200` nur für bereits markierte, sichtbare Skills.
- Belege werden für öffentliche Aufrufer unkenntlich gemacht und enthalten Rohdatenausschnitte nur für Eigentümer/Moderatoren.

### `POST /api/v1/skills/{slug}/report`

Meldet einen Skill zur Überprüfung durch Moderatoren. Meldungen gelten für den gesamten Skill, können optional
mit einer Version verknüpft werden und werden in die Warteschlange für Skill-Meldungen aufgenommen.

Authentifizierung:

- Erfordert ein API-Token.

Anfrage:

```json
{ "reason": "Verdächtiger Installationsschritt", "version": "1.2.3" }
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

Moderator-/Administrator-Endpunkt zur Entgegennahme von Skill-Meldungen.

Abfrageparameter:

- `status` (optional): `open` (Standard), `confirmed`, `dismissed` oder `all`
- `limit` (optional): Ganzzahl (1-200)
- `cursor` (optional): Paginierungscursor

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
      "reason": "Verdächtiger Installationsschritt",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Meldende Person"
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

Moderator-/Admin-Endpunkt zum Klären oder erneuten Öffnen von Skill-Meldungen.

Anfrage:

```json
{ "status": "confirmed", "note": "Geprüft und betroffene Version ausgeblendet.", "finalAction": "hide" }
```

`note` ist für `confirmed` und `dismissed` erforderlich; beim
Zurücksetzen von `status` auf `open` kann es weggelassen werden. Übergeben Sie `finalAction: "hide"` mit einer triagierten
Meldung, um den Skill im selben auditierbaren Workflow auszublenden.

### `GET /api/v1/skills/{slug}/versions`

Abfrageparameter:

- `limit` (optional): Ganzzahl
- `cursor` (optional): Paginierungscursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Gibt Versionsmetadaten und eine Dateiliste zurück.

- `version.security` enthält den normalisierten Verifizierungsstatus des Scans und Scanner-Details
  (VirusTotal + LLM), sofern verfügbar.

### `GET /api/v1/skills/{slug}/scan`

Gibt Details zur Verifizierung des Sicherheitsscans für eine Skill-Version zurück.

Abfrageparameter:

- `version` (optional): bestimmte Versionszeichenfolge.
- `tag` (optional): eine getaggte Version auflösen (zum Beispiel `latest`).

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Enthält den normalisierten Verifizierungsstatus sowie scannerspezifische Details.
- `security.hasScanResult` ist nur dann `true`, wenn ein Scanner ein eindeutiges Urteil erzeugt hat (`clean`, `suspicious` oder `malicious`).
- `moderation` ist eine aktuelle, aus der neuesten Version abgeleitete Moderationsmomentaufnahme auf Skill-Ebene.
- Prüfen Sie bei der Abfrage einer historischen Version `moderation.matchesRequestedVersion` und `moderation.sourceVersion`, bevor Sie `moderation` und `security` als denselben Versionskontext behandeln.

### `POST /api/v1/skills/-/scan`

Authentifizierter Übermittlungsendpunkt für neue ClawScan-Aufträge.

Scans lokaler Uploads werden nicht mehr unterstützt. Anfragen mit
`multipart/form-data` oder `{ "source": { "kind": "upload" } }` geben `410` zurück.

Veröffentlichte Scans verwenden JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Hinweise:

- Scan-Anfrage-Payloads und herunterladbare Berichte laufen nach Ablauf des Aufbewahrungszeitraums im Scan-Anfrage-Speicher ab.
- Veröffentlichte Scans erfordern Verwaltungszugriff als Eigentümer/Publisher oder Moderator-/Admin-Berechtigung der Plattform.
- Veröffentlichte Scans schreiben nur zurück, wenn `update: true` gilt und der Scan erfolgreich abgeschlossen wird.
- Die Antwort lautet `202` mit `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scan-Aufträge werden asynchron ausgeführt. Manuelle Scan-Anfragen werden gegenüber normalen Veröffentlichungs-/Backfill-Aufgaben priorisiert, der Abschluss hängt jedoch weiterhin von der Verfügbarkeit der Worker ab.

### `GET /api/v1/skills/-/scan/{scanId}`

Authentifizierter Abfrageendpunkt für einen übermittelten Scan.

- Gibt den Status „in Warteschlange“, „wird ausgeführt“, „erfolgreich“ oder „fehlgeschlagen“ zurück.
- Gibt während der Wartezeit `queue.queuedAhead` und `queue.position` zurück, damit Clients anzeigen können, wie viele priorisierte manuelle Scans sich vor der Anfrage befinden. Sehr große Warteschlangen werden begrenzt und mit `queuedAheadIsEstimate: true` gemeldet.
- Sofern verfügbar, enthält `report` die Abschnitte `clawscan`, `skillspector`, `staticAnalysis` und `virustotal`.
- Fehlgeschlagene Scan-Aufträge geben `status: "failed"` mit `lastError` zurück.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Authentifizierter Endpunkt für das Berichtsarchiv.

- Erfordert einen erfolgreichen Scan; nicht abgeschlossene Scans geben `409` zurück.
- Gibt eine ZIP-Datei mit `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` und `README.md` zurück.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Authentifizierter Endpunkt für gespeicherte Berichtsarchive übermittelter Versionen.

- Erfordert Verwaltungszugriff als Eigentümer/Publisher auf den Skill oder das Plugin oder Moderator-/Admin-Berechtigung der Plattform.
- Gibt gespeicherte Scan-Ergebnisse für die exakt übermittelte Version zurück, einschließlich blockierter oder ausgeblendeter Versionen.
- `kind` ist standardmäßig `skill`; verwenden Sie `kind=plugin` für Plugin-/Paket-Scans.
- Gibt dieselbe ZIP-Struktur wie Downloads von Scan-Anfragen zurück.

### `POST /api/v1/skills/-/scan/batch`

Nur für Admins zugängliche kanonische Route für erneute Batch-Scans. Sie akzeptiert dieselbe Payload-Struktur wie das veraltete `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Nur für Admins zugängliche kanonische Route für den Batch-Status. Sie akzeptiert `{ "jobIds": ["..."] }` und gibt dieselben aggregierten Zähler wie das veraltete `POST /api/v1/skills/-/rescan-batch/status` zurück.

### `GET /api/v1/skills/{slug}/verify`

Gibt den von `clawhub skill verify` verwendeten Verifizierungsumschlag der Skill Card zurück.

Abfrageparameter:

- `version` (optional): bestimmte Versionszeichenfolge.
- `tag` (optional): eine getaggte Version auflösen (zum Beispiel `latest`).

Hinweise:

- `ok` ist nur dann `true`, wenn für die ausgewählte Version eine Skill Card generiert wurde, sie nicht durch die Malware-Moderation blockiert ist und die ClawScan-Verifizierung keine Beanstandungen aufweist.
- Die Skill-Identität, die Publisher-Identität und die Metadaten der ausgewählten Version sind Felder auf oberster Umschlagebene (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), damit Shell-Automatisierungen sie lesen können, ohne verschachtelte Wrapper entpacken zu müssen.
- `security` ist das ClawScan-/Sicherheitsurteil auf oberster Ebene. Automatisierungen sollten sich an `ok`, `decision`, `reasons` und `security.status` orientieren.
- `security.signals` enthält unterstützende Scanner-Nachweise wie `staticScan`, `virusTotal` und `skillSpector`.
- `security.signals.dependencyRegistry` wird für die Kompatibilität der v1-Antwort beibehalten, der Scanner zur Prüfung der Existenz im Abhängigkeitsregister wurde jedoch eingestellt und dieser Schlüssel ist immer `null`.
- `provenance` ist nur dann `server-resolved-github-import`, wenn ClawHub während der Veröffentlichung oder des Imports ein GitHub-Repository/eine Referenz/einen Commit/einen Pfad aufgelöst und gespeichert hat; andernfalls ist es `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Gibt aktuelle kompakte Sicherheitsurteile für exakte Skill-Versionen zurück. Dieser
Sammlungsendpunkt ist für Clients vorgesehen, die bereits wissen, welche installierten
ClawHub-Skill-Versionen sie anzeigen müssen, beispielsweise die OpenClaw Control UI.

Anfrage:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Hinweise:

- `items` muss 1–100 eindeutige `{ slug, version }`-Paare enthalten.
- Ergebnisse werden pro Element zurückgegeben; ein fehlender Skill oder eine fehlende Version lässt nicht die gesamte Antwort fehlschlagen.
- Die Antwort enthält ausschließlich Sicherheitsinformationen. Sie enthält weder Skill-Card-Daten noch den Status generierter Karten, Dateilisten von Artefakten oder detaillierte Scanner-Payloads.
- `security.signals` enthält nur unterstützende Nachweise auf Statusebene; verwenden Sie `/scan` oder die Sicherheitsprüfungsseite von ClawHub für vollständige Scanner-Details.
- `security.signals.dependencyRegistry` wird für die Kompatibilität der v1-Antwort beibehalten, der Scanner zur Prüfung der Existenz im Abhängigkeitsregister wurde jedoch eingestellt und dieser Schlüssel ist immer `null`.
- Das Fehlen einer Skill Card wirkt sich nicht auf `ok`, `decision` oder `reasons` dieses Endpunkts aus; Clients sollten das installierte `skill-card.md` lokal lesen, wenn sie Karteninhalte benötigen.
- Verwenden Sie `/verify`, wenn Sie den Verifizierungsumschlag der Skill Card für einen einzelnen Skill benötigen, `/card`, wenn Sie das generierte Karten-Markdown benötigen, und `/scan`, wenn Sie detaillierte Scanner-Daten benötigen.

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
      "error": { "code": "version_not_found", "message": "Version nicht gefunden" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Gibt den unverarbeiteten Textinhalt zurück.

Abfrageparameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig die neueste Version.
- Dateigrößenlimit: 200KB.

### `GET /api/v1/packages`

Einheitlicher Katalogendpunkt für:

- Skills
- Code-Plugins
- Bundle-Plugins

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungscursor
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `sort` (optional): `updated` (Standard), `recommended`, `trending`, `downloads`, veralteter Alias `installs`
- `category` (optional): Filter für Plugin-Kategorien. Wird nur unterstützt, wenn die
  Anfrage auf Plugin-Pakete beschränkt ist (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` oder Paketendpunkte mit
  `family=code-plugin`/`family=bundle-plugin`). Kontrollierte Kategorien und
  veraltete v1-Filteraliase sind unter `GET /api/v1/plugins` dokumentiert.

Hinweise:

- Ungültige Werte für `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` oder `sort` geben `400` zurück. Unbekannte Abfrageparameter werden ignoriert.
- `GET /api/v1/code-plugins` und `GET /api/v1/bundle-plugins` bleiben Aliase für feste Familien.
- Skill-Einträge werden weiterhin durch das Skill-Register gestützt und können nach wie vor nur über `POST /api/v1/skills` veröffentlicht werden.
- `POST /api/v1/packages` ist weiterhin ausschließlich für Veröffentlichungen von Code-Plugins und Bundle-Plugins vorgesehen.
- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können in Listen-/Suchergebnissen private Pakete von Publishern sehen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen darf.

### `GET /api/v1/packages/search`

Einheitliche Katalogsuche über Skills und Plugin-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl (1–100)
- `family` (optional): `skill`, `code-plugin` oder `bundle-plugin`
- `channel` (optional): `official`, `community` oder `private`
- `isOfficial` (optional): `true` oder `false`
- `category` (optional): Filter für die Plugin-Kategorie. Wird nur unterstützt, wenn die
  Anfrage auf Plugin-Pakete beschränkt ist. Kontrollierte Kategorien und ältere v1-
  Filteraliase sind unter `GET /api/v1/plugins` dokumentiert.

Hinweise:

- Ungültige Werte für `family`, `channel`, `isOfficial`, `featured` oder
  `highlightedOnly` geben `400` zurück. Unbekannte Abfrageparameter werden ignoriert.
- Anonyme Aufrufer sehen nur öffentliche Paketkanäle.
- Authentifizierte Aufrufer können private Pakete von Herausgebern durchsuchen, denen sie angehören.
- `channel=private` gibt nur Pakete zurück, die der authentifizierte Aufrufer lesen kann.

### `GET /api/v1/plugins`

Ausschließlich auf Plugins beschränktes Durchsuchen des Katalogs über Code-Plugin- und Bundle-Plugin-Pakete hinweg.

Abfrageparameter:

- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungscursor
- `isOfficial` (optional): `true` oder `false`
- `sort` (optional): `recommended` (Standard), `trending`, `downloads`, `updated`, älterer Alias `installs`
- `category` (optional): Filter für die Plugin-Kategorie. Aktuelle Werte:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Ältere v1-Filteraliase werden von Leseendpunkten weiterhin akzeptiert:

- `mcp-tooling`, `data` und `automation` werden in `tools` aufgelöst.
- `observability` und `deployment` werden in `gateway` aufgelöst.
- `dev-tools` wird in `runtime` aufgelöst.

`trending` ist eine Rangliste der Installationen/Downloads über sieben Tage und verwendet keine Gesamtwerte über die gesamte Laufzeit.
Auf dem vereinheitlichten Endpunkt `/api/v1/packages` ist sie ausschließlich auf Plugins beschränkt; verwenden Sie
`/api/v1/skills?sort=trending` für den Skills-Katalog.

Ältere Aliase werden nicht als gespeicherte oder vom Autor deklarierte Kategoriewerte akzeptiert.

### `GET /api/v1/skills/export`

Massenexport der neuesten öffentlichen Skills zur Offline-Analyse.

Authentifizierung:

- API-Token erforderlich.

Abfrageparameter:

- `startDate` (erforderlich): Untergrenze in Unix-Millisekunden für `updatedAt` des Skills.
- `endDate` (erforderlich): Obergrenze in Unix-Millisekunden für `updatedAt` des Skills.
- `limit` (optional): Ganzzahl (1-250), Standard `250`.
- `cursor` (optional): Paginierungscursor aus der vorherigen Antwort.

Antwort:

- Textkörper: ZIP-Archiv.
- Jeder exportierte Skill hat sein Stammverzeichnis unter `{publisher}/{slug}/`.
- Gehostete Skills enthalten die Dateien der neuesten gespeicherten Version und werden in
  `_manifest.json` mit `sourceRef: "public-clawhub"` aufgeführt.
- Aktuelle GitHub-basierte Skills mit einem Scan vom Typ `clean` oder `suspicious` enthalten
  `_source_handoff.json` mit `sourceRef: "public-github"`, Repository, Commit, Pfad,
  Inhalts-Hash und Archiv-URL. Sie enthalten keine von ClawHub gehosteten Quelldateien.
- Jeder Skill enthält `_export_skill_meta.json`.
- `_manifest.json` ist immer im Stammverzeichnis der ZIP-Datei enthalten.
- `_errors.json` ist enthalten, wenn einzelne Skills oder Dateien nicht
  exportiert werden konnten.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Massenexport der neuesten öffentlichen Plugin-Releases zur Offline-Analyse.

Authentifizierung:

- API-Token erforderlich.

Abfrageparameter:

- `startDate` (erforderlich): Untergrenze in Unix-Millisekunden für `updatedAt` des Plugins.
- `endDate` (erforderlich): Obergrenze in Unix-Millisekunden für `updatedAt` des Plugins.
- `limit` (optional): Ganzzahl (1-250), Standard `250`.
- `cursor` (optional): Paginierungscursor aus der vorherigen Antwort.
- `family` (optional): `code-plugin` oder `bundle-plugin`. Wenn nicht angegeben, sind beide
  Plugin-Familien gemeint.

Antwort:

- Textkörper: ZIP-Archiv.
- Jedes exportierte Plugin hat sein Stammverzeichnis unter `{family}/{packageName}/`.
- Jedes exportierte Plugin enthält die gespeicherten Dateien des neuesten Releases.
- Die Exportmetadaten je Plugin werden unter
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` gespeichert.
- `_manifest.json` ist immer im Stammverzeichnis der ZIP-Datei enthalten.
- `_errors.json` ist enthalten, wenn einzelne Plugins oder Dateien nicht
  exportiert werden konnten.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Ausschließlich auf Plugins beschränkte Suche über Code-Plugin- und Bundle-Plugin-Pakete hinweg.

Abfrageparameter:

- `q` (erforderlich): Abfragezeichenfolge
- `limit` (optional): Ganzzahl (1-100)
- `isOfficial` (optional): `true` oder `false`
- `category` (optional): Filter für die Plugin-Kategorie. Aktuelle Werte:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Hinweise:

- Die unter `GET /api/v1/plugins` dokumentierten älteren v1-Filteraliase werden ebenfalls
  akzeptiert.
- Die Kategoriefilterung ist ein echter API-Filter, der auf Digest-
  Zeilen für Plugin-Kategorien basiert, und keine Umschreibung der Suchabfrage.
- Ergebnisse werden nach Relevanz sortiert zurückgegeben und derzeit nicht paginiert.
- Die Sortiersteuerelemente der Browser-Benutzeroberfläche für die Plugin-Suche sortieren die geladenen Relevanzergebnisse neu,
  entsprechend dem aktuellen Durchsuchungsverhalten von `/skills`.

### `GET /api/v1/packages/{name}`

Gibt die Detailmetadaten eines Pakets zurück.

Hinweise:

- Skills können im vereinheitlichten Katalog ebenfalls über diese Route aufgelöst werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Herausgeber nicht lesen darf.

### `DELETE /api/v1/packages/{name}`

Löscht ein Paket und alle Releases vorläufig.

Hinweise:

- Erfordert ein API-Token für den Paketbesitzer, einen Besitzer/Administrator der herausgebenden Organisation,
  einen Plattformmoderator oder einen Plattformadministrator.

### `GET /api/v1/packages/{name}/versions`

Gibt den Versionsverlauf zurück.

Abfrageparameter:

- `limit` (optional): Ganzzahl (1–100)
- `cursor` (optional): Paginierungscursor

Hinweise:

- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Herausgeber nicht lesen darf.

### `GET /api/v1/packages/{name}/versions/{version}`

Gibt eine Paketversion einschließlich Dateimetadaten, Kompatibilität,
Verifizierung, Artefaktmetadaten und Scandaten zurück.

Hinweise:

- `version.artifact.kind` ist `legacy-zip` für Paketarchive der alten Struktur oder
  `npm-pack` für ClawPack-basierte Releases.
- ClawPack-Releases enthalten die npm-kompatiblen Felder `npmIntegrity`, `npmShasum` und
  `npmTarballName`.
- `version.sha256hash` sind veraltete Kompatibilitätsmetadaten für alte Clients. Sie
  hashen exakt die von `/api/v1/packages/{name}/download` zurückgegebenen ZIP-Bytes.
  Moderne Clients sollten `version.artifact.sha256` verwenden, das das
  kanonische Release-Artefakt identifiziert.
- `version.vtAnalysis`, `version.llmAnalysis` und `version.staticScan` sind
  enthalten, wenn Scandaten vorhanden sind.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Herausgeber nicht lesen darf.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Gibt die genaue Sicherheits- und Vertrauenszusammenfassung des Paket-Releases für Installations-
Clients zurück. Dies ist die öffentliche OpenClaw-Nutzungsoberfläche für die Entscheidung, ob ein
aufgelöstes Release installiert werden darf.

Authentifizierung:

- Öffentlicher Leseendpunkt. Es ist kein Token eines Besitzers, Herausgebers, Moderators oder Administrators
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
  genaue Release, das ausgewertet wurde.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` und `release.npmTarballName` sind vorhanden, wenn sie für
  das Release-Artefakt bekannt sind.
- `trust.scanStatus` ist der effektive Vertrauensstatus, der aus Scanner-Eingaben
  und der manuellen Release-Moderation abgeleitet wird.
- `trust.moderationState` kann null sein. Der Wert ist `null`, wenn keine manuelle Release-
  Moderation vorhanden ist.
- `trust.blockedFromDownload` ist das Signal zur Installationssperre. OpenClaw und andere
  Installations-Clients sollten die Installation blockieren, wenn dieser Wert `true` ist, statt
  die Sperrregeln erneut aus Scanner- oder Moderationsfeldern abzuleiten.
- `trust.reasons` ist die benutzerseitige und für Audits bestimmte Erklärungsliste. Ursachencodes
  sind stabile, kompakte Zeichenfolgen wie `manual:quarantined`, `scan:malicious`
  und `package:malicious`.
- `trust.pending` bedeutet, dass mindestens eine Vertrauenseingabe noch auf ihren Abschluss wartet.
- `trust.stale` bedeutet, dass die Vertrauenszusammenfassung anhand veralteter Eingaben berechnet wurde und
  vor einer Freigabeentscheidung mit hoher Sicherheit als aktualisierungsbedürftig behandelt werden sollte.

Hinweise:

- Dieser Endpunkt ist versionsgenau. Clients sollten ihn nach der Auflösung der
  Paketversion aufrufen, die sie installieren möchten, und nicht nur nach dem Lesen der neuesten
  Paketmetadaten.
- Private Pakete geben `404` zurück, sofern der Aufrufer den zugehörigen Herausgeber nicht lesen darf.
- Dieser Endpunkt ist absichtlich enger gefasst als Moderationsendpunkte für Besitzer/Moderatoren.
  Er stellt die Installationsentscheidung und die öffentliche Erklärung bereit, jedoch keine
  Identitäten von Meldenden, Meldungsinhalte, privaten Nachweise oder internen Zeitpläne der
  Überprüfung.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Gibt die expliziten Metadaten des Artefakt-Resolvers für eine Paketversion zurück.

Hinweise:

- Ältere Paketversionen geben ein Artefakt vom Typ `legacy-zip` und eine ältere ZIP-
  `downloadUrl` zurück.
- ClawPack-Versionen geben ein Artefakt vom Typ `npm-pack`, npm-Integritätsfelder, eine
  `tarballUrl` und die ältere ZIP-Kompatibilitäts-URL zurück.
- Dies ist die OpenClaw-Resolver-Oberfläche; sie vermeidet es, das Archivformat anhand
  einer gemeinsamen URL zu erraten.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Lädt das Versionsartefakt über den expliziten Resolver-Pfad herunter.

Hinweise:

- ClawPack-Versionen streamen exakt die hochgeladenen `.tgz`-Bytes aus npm-pack.
- Ältere ZIP-Versionen leiten zu `/api/v1/packages/{name}/download?version=` weiter.
- Verwendet das Ratenlimit-Kontingent für Downloads.

### `GET /api/v1/packages/{name}/readiness`

Gibt die berechnete Bereitschaft für die zukünftige Nutzung durch OpenClaw zurück.

Die Bereitschaftsprüfungen umfassen:

- Status des offiziellen Kanals
- Verfügbarkeit der neuesten Version
- Verfügbarkeit des ClawPack-npm-pack-Artefakts
- Artefakt-Digest
- Herkunft von Quell-Repository und Commit
- OpenClaw-Kompatibilitätsmetadaten
- Host-Ziele
- Scanstatus

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

Moderator-Endpunkt zum Auflisten der Migrationsdatensätze offizieller OpenClaw-Plugins.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator oder Administrator.

Abfrageparameter:

- `phase` (optional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` oder
  `all` (Standardwert).
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungscursor

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

Administrator-Endpunkt zum Erstellen oder Aktualisieren eines Migrationsdatensatzes für ein offizielles Plugin.

Authentifizierung:

- Erfordert ein API-Token für einen Administrator.

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
- `packageName` wird gemäß npm-Namenskonventionen normalisiert; bei geplanten
  Migrationen kann das Paket fehlen.
- Hiermit wird ausschließlich die Migrationsbereitschaft verfolgt. OpenClaw wird dadurch weder geändert noch werden
  ClawPacks generiert.

### `GET /api/v1/packages/moderation/queue`

Moderator-/Administrator-Endpunkt für Warteschlangen zur Prüfung von Paket-Releases.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator oder Administrator.

Abfrageparameter:

- `status` (optional): `open` (Standardwert), `blocked`, `manual` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungscursor

Bedeutung der Statuswerte:

- `open`: verdächtige, schädliche, ausstehende, unter Quarantäne gestellte, widerrufene oder gemeldete Releases.
- `blocked`: unter Quarantäne gestellte, widerrufene oder schädliche Releases.
- `manual`: alle Releases mit einer manuellen Moderationsüberschreibung.
- `all`: alle Releases mit einer manuellen Überschreibung, einem nicht bereinigten Scanstatus oder einer Paketmeldung.

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

Meldet ein Paket zur Prüfung durch einen Moderator. Meldungen gelten auf Paketebene und können optional
mit einer Version verknüpft sein. Sie werden in die Moderationswarteschlange aufgenommen, führen jedoch nicht automatisch dazu, dass
Downloads ausgeblendet oder blockiert werden. Moderatoren sollten die Release-Moderation verwenden, um
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

Moderator-/Administrator-Endpunkt zur Annahme von Paketmeldungen.

Authentifizierung:

- Erfordert ein API-Token für einen Moderator oder Administrator.

Abfrageparameter:

- `status` (optional): `open` (Standardwert), `confirmed`, `dismissed` oder `all`
- `limit` (optional): Ganzzahl (1-100)
- `cursor` (optional): Paginierungscursor

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

Eigentümer-/Moderator-Endpunkt für den Einblick in die Paketmoderation.

Authentifizierung:

- Erfordert ein API-Token für den Paketeigentümer, ein Mitglied des Herausgebers, einen Moderator oder
  Administrator.

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

Moderator-/Administrator-Endpunkt zum Abschließen oder erneuten Öffnen von Paketmeldungen.

Anfrage:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` ist für `confirmed` und `dismissed` erforderlich; beim Zurücksetzen von
`status` auf `open` kann es weggelassen werden. Übergeben Sie `finalAction: "quarantine"` oder
`finalAction: "revoke"` zusammen mit einer bestätigten Meldung, um die Release-Moderation im
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

Moderator-/Administrator-Endpunkt zur Prüfung eines Paket-Releases.

Anfrage:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Unterstützte Statuswerte:

- `approved`: manuell geprüft und zugelassen.
- `quarantined`: bis zur weiteren Prüfung blockiert.
- `revoked`: blockiert, nachdem ein Release zuvor als vertrauenswürdig eingestuft war.

Unter Quarantäne gestellte und widerrufene Releases geben bei Artefakt-Downloadrouten `403` zurück.
Jede Änderung erzeugt einen Eintrag im Auditprotokoll.

### `GET /api/v1/packages/{name}/file`

Gibt den reinen Textinhalt einer Paketdatei zurück.

Abfrageparameter:

- `path` (erforderlich)
- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig das neueste Release.
- Verwendet das Ratenlimit-Kontingent für Lesezugriffe, nicht das Download-Kontingent.
- Binärdateien geben `415` zurück.
- Maximale Dateigröße: 200KB.
- Ausstehende VirusTotal-Scans blockieren Lesezugriffe nicht; schädliche Releases können an anderer Stelle dennoch zurückgehalten werden.
- Private Pakete geben `404` zurück, sofern der Aufrufer nicht zum Lesen des besitzenden Herausgebers berechtigt ist.

### `GET /api/v1/packages/{name}/download`

Lädt das ältere deterministische ZIP-Archiv für ein Paket-Release herunter.

Abfrageparameter:

- `version` (optional)
- `tag` (optional)

Hinweise:

- Verwendet standardmäßig das neueste Release.
- Skills leiten zu `GET /api/v1/download` weiter.
- Plugin-/Paketarchive sind ZIP-Dateien mit einem `package/`-Stammverzeichnis, damit ältere OpenClaw-
  Clients weiterhin funktionieren.
- Diese Route bleibt ausschließlich ZIP-basiert. Sie streamt keine ClawPack-`.tgz`-Dateien.
- Antworten enthalten die Header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` und
  `X-ClawHub-Artifact-Sha256` für Integritätsprüfungen durch den Resolver.
- Metadaten, die ausschließlich für die Registry bestimmt sind, werden nicht in das heruntergeladene Archiv eingefügt.
- Ausstehende VirusTotal-Scans blockieren Downloads nicht; schädliche Releases geben `403` zurück.
- Private Pakete geben `404` zurück, sofern der Aufrufer nicht der Eigentümer ist.

### `GET /api/npm/{package}`

Gibt ein npm-kompatibles Packument für ClawPack-gestützte Paketversionen zurück.

Hinweise:

- Es werden nur Versionen mit hochgeladenen ClawPack-npm-pack-Tarballs aufgeführt.
- Ältere reine ZIP-Versionen werden absichtlich ausgelassen.
- `dist.tarball`, `dist.integrity` und `dist.shasum` verwenden npm-kompatible
  Felder, damit Benutzer npm bei Bedarf auf den Mirror verweisen können.
- Packuments für Pakete mit Gültigkeitsbereich unterstützen sowohl `/api/npm/@scope/name` als auch den von npm
  codierten Anfragepfad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt für npm-Mirror-Clients exakt die hochgeladenen ClawPack-Tarball-Bytes.

Hinweise:

- Verwendet das Ratenlimit-Kontingent für Downloads.
- Download-Header enthalten ClawHub-SHA-256 sowie npm-Integritäts-/Shasum-Metadaten.
- Moderations- und Zugriffsprüfungen für private Pakete gelten weiterhin.

### `GET /api/v1/resolve`

Wird von der CLI verwendet, um einen lokalen Fingerabdruck einer bekannten Version zuzuordnen.

Abfrageparameter:

- `slug` (erforderlich)
- `hash` (erforderlich): 64-stelliger hexadezimaler SHA-256-Wert des Bundle-Fingerabdrucks

Antwort:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Lädt die ZIP-Datei einer gehosteten Skill-Version herunter oder gibt eine Übergabe an die GitHub-Quelle für einen
aktuellen GitHub-gestützten Skill mit einem `clean`- oder `suspicious`-Scan und ohne gehostete
Version zurück.

Abfrageparameter:

- `slug` (erforderlich)
- `version` (optional): Semver-Zeichenfolge
- `tag` (optional): Tag-Name (z. B. `latest`)

Hinweise:

- Wenn weder `version` noch `tag` angegeben ist, wird die neueste Version verwendet.
- Vorläufig gelöschte Versionen geben `410` zurück.
- GitHub-gestützte Skill-Übergaben leiten keine Bytes weiter und spiegeln sie nicht. Die JSON-Antwort
  enthält `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  und `archiveUrl`; der Scan-/aktuelle Status dient als Sperre und ist nicht als Metadaten
  der erfolgreichen Nutzlast enthalten.
- Downloadstatistiken werden pro UTC-Tag als eindeutige Identitäten gezählt (`userId`, wenn das API-Token gültig ist, andernfalls die IP-Adresse).

## Authentifizierungsendpunkte (Bearer-Token)

Alle Endpunkte erfordern:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Validiert das Token und gibt den Benutzer-Handle zurück.

### `POST /api/v1/skills`

Veröffentlicht eine neue Version.

- Bevorzugt: `multipart/form-data` mit `payload`-JSON und `files[]`-Blobs.
- Ein JSON-Body mit `files` (auf Basis der Speicher-ID) wird ebenfalls akzeptiert.
- Optionales Nutzlastfeld: `ownerHandle`. Wenn vorhanden, löst die API diesen
  Herausgeber serverseitig auf und verlangt, dass der Akteur Herausgeberzugriff hat.
- Optionales Nutzlastfeld: `migrateOwner`. Bei `true` mit `ownerHandle` kann
  ein vorhandener Skill zu diesem Eigentümer verschoben werden, wenn der Akteur sowohl beim
  aktuellen als auch beim Zielherausgeber Administrator/Eigentümer ist. Ohne diese ausdrückliche Zustimmung
  werden Eigentümeränderungen abgelehnt.

### `POST /api/v1/packages`

Veröffentlicht ein Code-Plugin- oder Bundle-Plugin-Release.

- Erfordert die Authentifizierung mit einem Bearer-Token.
- Erfordert `multipart/form-data`.
- Zulässige Formularfelder sind `payload`, wiederholte `files`-Blobs oder eine `clawpack`-
  Tarball-Referenz. `clawpack` kann ein `.tgz`-Blob oder eine vom
  Upload-URL-Ablauf zurückgegebene Speicher-ID sein. Veröffentlichungen mit bereitgestellter Speicher-ID müssen außerdem
  das mit dieser Upload-URL zurückgegebene `clawpackUploadTicket` enthalten.
- Verwenden Sie entweder `files` oder `clawpack`, niemals beide in derselben Anfrage.
- JSON-Bodys und vom Aufrufer bereitgestellte `payload.files`- / `payload.artifact`-
  Metadaten werden abgelehnt.
- Direkte mehrteilige Veröffentlichungsanfragen sind auf 18MB begrenzt. ClawPack-Tarballs können
  den Upload-URL-Ablauf bis zur Tarball-Höchstgrenze von 120MB verwenden.
- Optionales Nutzlastfeld: `ownerHandle`. Wenn vorhanden, dürfen nur Administratoren im Namen dieses Eigentümers veröffentlichen.

Wichtige Validierungsregeln:

- `family` muss `code-plugin` oder `bundle-plugin` sein.
- Plugin-Pakete erfordern `openclaw.plugin.json`. ClawPack-`.tgz`-Uploads müssen
  es unter `package/openclaw.plugin.json` enthalten.
- Code-Plugins erfordern `package.json`, Quell-Repository-Metadaten, Quell-Commit-
  Metadaten, Konfigurationsschema-Metadaten, `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
- Nur der Organisationsherausgeber `openclaw` und die persönlichen Herausgeber aktueller Mitglieder der Organisation
  `openclaw` dürfen im Kanal `official` veröffentlichen.
- Veröffentlichungen im Namen anderer prüfen die Berechtigung für den offiziellen Kanal weiterhin anhand des Kontos des Zieleigentümers.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Einen Skill vorläufig löschen/wiederherstellen (Eigentümer, Moderator oder Administrator).

Optionaler JSON-Body:

```json
{ "reason": "Zur Moderation bis zum Abschluss der rechtlichen Prüfung zurückgehalten." }
```

Wenn vorhanden, wird `reason` als Moderationshinweis des Skills gespeichert und in das Auditprotokoll kopiert.
Vom Eigentümer veranlasste vorläufige Löschungen reservieren den Slug für 30 Tage; anschließend kann der Slug von
einem anderen Herausgeber beansprucht werden. Die Löschantwort enthält `slugReservedUntil`, wenn diese Frist gilt.
Ausblendungen durch Moderatoren/Administratoren und sicherheitsbedingte Entfernungen laufen nicht auf diese Weise ab.

Löschantwort:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: erfolgreich
- `401`: nicht authentifiziert
- `403`: unzulässig
- `404`: Skill/Benutzer nicht gefunden
- `500`: interner Serverfehler

### `POST /api/v1/users/publisher`

Nur für Administratoren. Stellt sicher, dass für einen Handle ein Organisationsherausgeber vorhanden ist. Wenn der Handle noch auf einen
alten gemeinsam genutzten Benutzer-/persönlichen Herausgeber verweist, migriert der Endpunkt ihn zuerst zu einem Organisationsherausgeber.
Geben Sie für eine neu erstellte Organisation `memberHandle` an; der ausführende Administrator wird nicht als Mitglied hinzugefügt.
`memberRole` ist standardmäßig `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authentifizierte Self-Service-Erstellung eines Organisationsherausgebers. Erstellt einen neuen Organisationsherausgeber und fügt den
Aufrufer als Eigentümer hinzu. Dieser Endpunkt migriert keine vorhandenen Benutzer-/persönlichen Handles und
kennzeichnet den Herausgeber nicht als vertrauenswürdig/offiziell.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Antwort: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Gibt `409` zurück, wenn der Handle bereits von einem Herausgeber, Benutzer oder persönlichen Herausgeber verwendet wird.

### `POST /api/v1/users/reserve`

Nur für Administratoren. Reserviert Stamm-Slugs und Paketnamen für einen rechtmäßigen Eigentümer, ohne ein
Release zu veröffentlichen. Paketnamen werden zu privaten Platzhalterpaketen ohne Release-Zeilen, sodass derselbe
Eigentümer später das tatsächliche Code-Plugin- oder Bundle-Plugin-Release unter diesem Namen veröffentlichen kann.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwort: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Nur für Administratoren. Stellt einen persönlichen Herausgeber für einen verifizierten Ersatz-GitHub-OAuth-Principal wieder her,
ohne Convex-Auth-Kontozeilen zu bearbeiten. Die Anfrage muss beide unveränderlichen GitHub-
Provider-Konto-IDs nennen; veränderliche Handles werden nur als Schutzprüfung für Bediener verwendet.

Der Endpunkt verwendet standardmäßig einen Probelauf. Die Wiederherstellung erfordert `dryRun: false` und
`confirmIdentityVerified: true`, nachdem Mitarbeitende die Kontinuität zwischen beiden
GitHub-Principals unabhängig überprüft haben. Die Wiederherstellung schlägt sicher fehl, wenn der aktuelle persönliche
Herausgeber des Zielbenutzers Skills, Pakete oder GitHub-Skill-Quellen hat.
Die Wiederherstellung migriert außerdem alte `ownerUserId`-Felder für die Skills des wiederhergestellten Herausgebers,
Skill-Slug-Aliasse, Pakete, Warnungen der Paketprüfung und abgeleitete Such-Digest-Zeilen, damit
Pfade mit direktem Eigentümer mit der neuen Herausgeberautorität übereinstimmen. Eine aktive Reservierung eines geschützten Handles
für den wiederhergestellten Handle wird ebenfalls dem Ersatzbenutzer neu zugewiesen, damit eine spätere
Profilsynchronisierung die konkurrierende Autorität des früheren Benutzers nicht wiederherstellen kann. Jede Primärtabelle ist pro Anwendungstransaktion auf
100 Zeilen begrenzt; größere Wiederherstellungen müssen zunächst eine fortsetzbare Eigentümermigration verwenden.
GitHub-Skill-Quellen sind herausgeberbezogen und werden als geprüft gemeldet, statt neu geschrieben zu werden.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Antwort: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpunkte zur Verwaltung von Eigentümer-Slugs

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwort: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwort: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Hinweise:

- Beide Endpunkte erfordern eine Authentifizierung per API-Token und funktionieren nur für den Eigentümer des Skills.
- `rename` behält den vorherigen Slug als Weiterleitungsalias bei.
- `merge` blendet den Quelleintrag aus und leitet den Quell-Slug zum Zieleintrag weiter.

### Endpunkte zur Eigentumsübertragung

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Antwort: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Antwort (annehmen/ablehnen/abbrechen): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Antwortstruktur: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Einen Benutzer sperren und seine Skills unwiderruflich löschen (nur Moderatoren/Administratoren).

Body:

```json
{ "handle": "user_handle", "reason": "optionaler Sperrgrund" }
```

oder

```json
{ "userId": "users_...", "reason": "optionaler Sperrgrund" }
```

Antwort:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Die Sperre eines Benutzers aufheben und geeignete Skills wiederherstellen (nur Administratoren).

Body:

```json
{ "handle": "user_handle", "reason": "optionaler Grund für die Aufhebung der Sperre" }
```

oder

```json
{ "userId": "users_...", "reason": "optionaler Grund für die Aufhebung der Sperre" }
```

Antwort:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Den gespeicherten Grund für eine vorhandene Sperre ändern, ohne die Sperre aufzuheben oder
Inhalte wiederherzustellen (nur Administratoren). Verwendet standardmäßig einen Probelauf, sofern `dryRun` nicht `false` ist.

Body:

```json
{ "handle": "user_handle", "reason": "Spam durch Massenveröffentlichungen", "dryRun": true }
```

oder

```json
{ "userId": "users_...", "reason": "Spam durch Massenveröffentlichungen", "dryRun": false }
```

Antwort:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "automatische Sperre wegen Schadsoftware",
  "nextReason": "Spam durch Massenveröffentlichungen",
  "changed": true
}
```

### `POST /api/v1/users/role`

Eine Benutzerrolle ändern (nur Administratoren).

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

Benutzer auflisten oder suchen (nur Administratoren).

Abfrageparameter:

- `q` (optional): Suchanfrage
- `query` (optional): Alias für `q`
- `limit` (optional): maximale Anzahl an Ergebnissen (Standardwert 20, höchstens 200)

Antwort:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Benutzer",
      "name": "Benutzer",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Eine Markierung hinzufügen/entfernen (Hervorhebungen). Beide Endpunkte sind idempotent.

Antworten:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Veraltete CLI-Endpunkte (abgekündigt)

Für ältere CLI-Versionen weiterhin unterstützt:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Den Plan zur Entfernung finden Sie unter `DEPRECATIONS.md`.

`POST /api/cli/upload-url` gibt `uploadUrl` und `uploadTicket` zurück. Paketveröffentlichungen,
die einen ClawPack-Tarball bereitstellen, müssen die resultierende Speicher-ID als
`clawpack` und das zurückgegebene Ticket als `clawpackUploadTicket` senden.

## Registry-Erkennung (`/.well-known/clawhub.json`)

Die CLI kann Registry-/Authentifizierungseinstellungen von der Website ermitteln:

- `/.well-known/clawhub.json` (JSON, bevorzugt)
- `/.well-known/clawdhub.json` (veraltet)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Wenn Sie selbst hosten, stellen Sie diese Datei bereit (oder setzen Sie `CLAWHUB_REGISTRY` ausdrücklich; veraltet: `CLAWDHUB_REGISTRY`).
