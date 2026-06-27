---
read_when:
    - API-Clients erstellen
    - Endpunkte oder Schemas hinzufügen
summary: Überblick und Konventionen der öffentlichen REST-API (v1).
x-i18n:
    generated_at: "2026-06-27T17:14:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Wiederverwendung des öffentlichen Katalogs

Sie können auf Basis der öffentlichen Lese-APIs von ClawHub einen Drittanbieter-Katalog, ein Verzeichnis oder eine Suchoberfläche erstellen. Öffentliche Skill-Metadaten und Skill-Dateien werden gemäß den Skill-Lizenzregeln von ClawHub veröffentlicht, während die API selbst ratenbegrenzt ist und verantwortungsvoll genutzt werden sollte.

Richtlinien:

- Verwenden Sie öffentliche Lese-Endpunkte wie `GET /api/v1/skills`, `GET /api/v1/search` und `GET /api/v1/skills/{slug}` für Katalogeinträge.
- Cachen Sie Antworten und beachten Sie `429`, `Retry-After` und Ratenlimit-Header, statt aggressiv zu pollen.
- Verlinken Sie beim Anzeigen von Einträgen zurück zur kanonischen ClawHub-Skill-URL, damit Benutzer den Quell-Registry-Eintrag prüfen können.
- Verwenden Sie kanonische Seiten-URLs in der Form `https://clawhub.ai/<owner>/skills/<slug>`.
- Erwecken Sie nicht den Eindruck, dass ClawHub die Drittanbieter-Website unterstützt, verifiziert oder betreibt.
- Spiegeln Sie keine versteckten, privaten oder durch Moderation blockierten Inhalte, indem Sie öffentliche API-Filter oder Auth-Grenzen umgehen.

## Authentifizierung

- Öffentliches Lesen: kein Token erforderlich.
- Schreiben + Konto: `Authorization: Bearer clh_...`.

## Ratenlimits

Auth-bewusste Durchsetzung:

- Anonyme Anfragen: pro IP.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Benutzer-Bucket.
- Fehlendes/ungültiges Token fällt auf IP-Durchsetzung zurück.

- Lesen: 3000/min pro IP, 12000/min pro Schlüssel
- Schreiben: 300/min pro IP, 3000/min pro Schlüssel
- Download: 1200/min pro IP, 6000/min pro Schlüssel

Header: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` und `Retry-After` sind bei `429` enthalten.

Semantik:

- `X-RateLimit-Reset`: Unix-Epochen-Sekunden (absolute Reset-Zeit)
- `RateLimit-Reset`: Verzögerung in Sekunden bis zum Reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exakt verbleibendes Budget, wenn
  vorhanden; geshardete erfolgreiche Anfragen lassen es weg, statt einen ungefähren
  globalen Wert zurückzugeben
- `Retry-After`: Verzögerung in Sekunden, die bei `429` gewartet werden soll

Beispiel `429`:

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

Client-Behandlung:

- Bevorzugen Sie `Retry-After`, wenn vorhanden.
- Verwenden Sie andernfalls `RateLimit-Reset` oder leiten Sie die Verzögerung aus `X-RateLimit-Reset` ab.
- Fügen Sie Wiederholungen Jitter hinzu.

## Fehler

- v1-Fehler sind Klartext (`text/plain; charset=utf-8`), einschließlich `400`,
  `401`, `403`, `404`, `429` und Antworten für blockierte Downloads.
- Unbekannte Abfrageparameter werden aus Kompatibilitätsgründen ignoriert.
- Bekannte Abfrageparameter mit ungültigen Werten geben `400` zurück.

## Endpunkte

Öffentliches Lesen:

- `GET /api/v1/search?q=...`
  - Optionale Filter: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy-Alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (Standard), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), Legacy-Installationsaliase `installsCurrent`/`installs`/`installsAllTime` werden `downloads` zugeordnet, `trending`
  - Ungültige `sort`-Werte geben `400` zurück
  - `cursor` gilt für Nicht-`trending`-Sortierungen
  - Optionaler Filter: `nonSuspiciousOnly=true`
  - Legacy-Alias: `nonSuspicious=true`
  - Mit `nonSuspiciousOnly=true` können cursorbasierte Seiten weniger als `limit` Elemente enthalten; verwenden Sie `nextCursor`, um fortzufahren.
  - `recommended` nutzt Engagement- und Aktualitätssignale.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Gehostete Skills geben deterministische ZIP-Bytes zurück.
  - Aktuelle GitHub-gestützte Skills mit einem `clean`- oder `suspicious`-Scan geben statt ClawHub-Bytes einen
    JSON-`public-github`-Übergabedeskriptor zurück.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Gehostete Skills werden als gespeicherte Dateien exportiert.
  - Aktuelle GitHub-gestützte Skills mit einem `clean`- oder `suspicious`-Scan werden
    als `public-github`-Übergabedeskriptoren exportiert.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (Standard), `recommended`, `downloads`, Legacy-Alias `installs`
  - Ungültige `sort`-Werte geben `400` zurück
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (Standard), `downloads`, `updated`, Legacy-Alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Authentifizierung erforderlich:

- `POST /api/v1/skills` (veröffentlichen, multipart bevorzugt)
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

Nur Admin:

- `POST /api/v1/users/reserve` reserviert Root-Slugs und private No-Release-Paketplatzhalter für ein Owner-Handle.

## Legacy

Legacy-`/api/*` und `/api/cli/*` sind weiterhin verfügbar. Siehe `DEPRECATIONS.md`.
