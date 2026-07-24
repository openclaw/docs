---
read_when:
    - API-Clients erstellen
    - Endpunkte oder Schemas hinzufügen
summary: Übersicht und Konventionen der öffentlichen REST-API (v1).
x-i18n:
    generated_at: "2026-07-24T03:41:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Wiederverwendung des öffentlichen Katalogs

Sie können auf Grundlage der öffentlichen Lese-APIs von ClawHub einen Katalog, ein Verzeichnis oder eine Suchoberfläche eines Drittanbieters erstellen. Öffentliche Metadaten und Dateien von Skills werden gemäß den Lizenzregeln für Skills von ClawHub veröffentlicht. Die API selbst unterliegt jedoch Ratenbegrenzungen und sollte verantwortungsvoll genutzt werden.

Richtlinien:

- Verwenden Sie für Katalogeinträge öffentliche Leseendpunkte wie `GET /api/v1/skills`, `GET /api/v1/search` und `GET /api/v1/skills/{slug}`.
- Speichern Sie Antworten zwischen und beachten Sie `429`, `Retry-After` sowie Ratenbegrenzungs-Header, statt häufige Abfragen durchzuführen.
- Verlinken Sie bei der Anzeige von Einträgen auf die kanonische URL des ClawHub-Skills, damit Benutzer den Quelldatensatz in der Registry prüfen können.
- Verwenden Sie kanonische Seiten-URLs im Format `https://clawhub.ai/<owner>/skills/<slug>`.
- Erwecken Sie nicht den Eindruck, dass ClawHub die Drittanbieter-Website unterstützt, überprüft oder betreibt.
- Spiegeln Sie keine ausgeblendeten, privaten oder durch die Moderation gesperrten Inhalte, indem Sie öffentliche API-Filter oder Authentifizierungsgrenzen umgehen.

## Authentifizierung

- Öffentlicher Lesezugriff: kein Token erforderlich.
- Schreibzugriff und Konto: `Authorization: Bearer clh_...`.

## Ratenbegrenzungen

Authentifizierungsabhängige Durchsetzung:

- Anonyme Anfragen: pro IP-Adresse.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Benutzerkontingent.
- Bei fehlendem oder ungültigem Token erfolgt die Durchsetzung anhand der IP-Adresse.

- Lesezugriff: 3000/min pro IP-Adresse, 12000/min pro Schlüssel
- Schreibzugriff: 300/min pro IP-Adresse, 3000/min pro Schlüssel
- Download: 1200/min pro IP-Adresse, 6000/min pro Schlüssel

Header: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` und `Retry-After` sind in `429` enthalten.

Semantik:

- `X-RateLimit-Reset`: Sekunden seit der Unix-Epoche (absoluter Rücksetzzeitpunkt)
- `RateLimit-Reset`: Verzögerung in Sekunden bis zur Rücksetzung
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exakt verbleibendes Kontingent, sofern
  vorhanden; bei erfolgreichen Anfragen mit Sharding wird es ausgelassen, statt einen ungefähren
  globalen Wert zurückzugeben
- `Retry-After`: bei `429` abzuwartende Verzögerung in Sekunden

Beispiel für `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Clientseitige Verarbeitung:

- Bevorzugen Sie `Retry-After`, sofern vorhanden.
- Verwenden Sie andernfalls `RateLimit-Reset` oder leiten Sie die Verzögerung aus `X-RateLimit-Reset` ab.
- Fügen Sie Wiederholungsversuchen Jitter hinzu.

## Fehler

- Fehler in v1 sind Klartext (`text/plain; charset=utf-8`), einschließlich `400`,
  `401`, `403`, `404`, `429` und Antworten bei gesperrten Downloads.
- Unbekannte Abfrageparameter werden aus Kompatibilitätsgründen ignoriert.
- Bekannte Abfrageparameter mit ungültigen Werten geben `400` zurück.

## Endpunkte

Öffentlicher Lesezugriff:

- `GET /api/v1/search?q=...`
  - Optionale Filter: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy-Alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (Standard), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), die Legacy-Installationsaliase `installsCurrent`/`installs`/`installsAllTime` werden `downloads`, `trending` zugeordnet
  - Ungültige Werte für `sort` geben `400` zurück
  - `cursor` gilt für Sortierungen außer `trending`
  - Optionaler Filter: `nonSuspiciousOnly=true`
  - Legacy-Alias: `nonSuspicious=true`
  - Mit `nonSuspiciousOnly=true` können cursorbasierte Seiten weniger als `limit` Elemente enthalten; verwenden Sie zum Fortfahren `nextCursor`.
  - `recommended` verwendet Interaktions- und Aktualitätssignale.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Gehostete Skills geben deterministische ZIP-Bytes zurück.
  - Aktuelle GitHub-basierte Skills mit einem Scan vom Typ `clean` oder `suspicious` geben statt ClawHub-Bytes einen
    JSON-Übergabedeskriptor vom Typ `public-github` zurück.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Gehostete Skills werden als gespeicherte Dateien exportiert.
  - Aktuelle GitHub-basierte Skills mit einem Scan vom Typ `clean` oder `suspicious` werden
    als Übergabedeskriptoren vom Typ `public-github` exportiert.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (Standard), `recommended`, `downloads`, Legacy-Alias `installs`
  - Ungültige Werte für `sort` geben `400` zurück
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (Standard), `downloads`, `updated`, Legacy-Alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Authentifizierung erforderlich:

- `POST /api/v1/skills` (Veröffentlichung, Multipart bevorzugt)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Nur für Administratoren:

- `POST /api/v1/users/reserve` reserviert Root-Slugs und private Paketplatzhalter ohne Release für einen Owner-Handle.

## Legacy

Die Legacy-Endpunkte `/api/*` und `/api/cli/*` sind weiterhin verfügbar. Siehe `DEPRECATIONS.md`.
