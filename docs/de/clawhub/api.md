---
read_when:
    - API-Clients erstellen
    - Endpunkte oder Schemata hinzufügen
summary: Übersicht und Konventionen der öffentlichen REST-API (v1).
x-i18n:
    generated_at: "2026-05-13T05:32:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Wiederverwendung des öffentlichen Katalogs

Sie können einen Drittanbieter-Katalog, ein Verzeichnis oder eine Suchoberfläche auf den öffentlichen Lese-APIs von ClawHub aufbauen. Öffentliche Skill-Metadaten und Skill-Dateien werden gemäß den Skill-Lizenzregeln von ClawHub veröffentlicht, während die API selbst ratenbegrenzt ist und verantwortungsvoll genutzt werden sollte.

Richtlinien:

- Verwenden Sie öffentliche Lese-Endpunkte wie `GET /api/v1/skills`, `GET /api/v1/search` und `GET /api/v1/skills/{slug}` für Katalogeinträge.
- Cachen Sie Antworten und respektieren Sie `429`, `Retry-After` sowie Rate-Limit-Header, statt aggressiv zu pollen.
- Verlinken Sie bei der Anzeige von Einträgen zurück zur kanonischen ClawHub-Skill-URL, damit Benutzer den Registry-Quelleneintrag prüfen können.
- Verwenden Sie kanonische Seiten-URLs im Format `https://clawhub.ai/<owner>/<slug>`.
- Erwecken Sie nicht den Eindruck, dass ClawHub die Drittanbieter-Website unterstützt, verifiziert oder betreibt.
- Spiegeln Sie keine versteckten, privaten oder durch Moderation blockierten Inhalte, indem Sie öffentliche API-Filter oder Auth-Grenzen umgehen.

## Auth

- Öffentliches Lesen: kein Token erforderlich.
- Schreiben + Konto: `Authorization: Bearer clh_...`.

## Ratenlimits

Auth-abhängige Durchsetzung:

- Anonyme Anfragen: pro IP.
- Authentifizierte Anfragen (gültiges Bearer-Token): pro Benutzer-Bucket.
- Fehlendes/ungültiges Token fällt auf IP-Durchsetzung zurück.

- Lesen: 600/min pro IP, 2400/min pro Schlüssel
- Schreiben: 45/min pro IP, 180/min pro Schlüssel

Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (bei 429).

Semantik:

- `X-RateLimit-Reset`: Unix-Epoch-Sekunden (absolute Zurücksetzungszeit)
- `RateLimit-Reset`: Verzögerung in Sekunden bis zum Zurücksetzen
- `Retry-After`: Verzögerung in Sekunden, die bei `429` gewartet werden soll

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

Client-Behandlung:

- Bevorzugen Sie `Retry-After`, wenn vorhanden.
- Verwenden Sie andernfalls `RateLimit-Reset` oder leiten Sie die Verzögerung aus `X-RateLimit-Reset` ab.
- Fügen Sie Wiederholungsversuchen Jitter hinzu.

## Endpunkte

Öffentliches Lesen:

- `GET /api/v1/search?q=...`
  - Optionale Filter: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy-Alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (Standard), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` gilt für Sortierungen außer `trending`
  - Optionaler Filter: `nonSuspiciousOnly=true`
  - Legacy-Alias: `nonSuspicious=true`
  - Mit `nonSuspiciousOnly=true` können cursorbasierte Seiten weniger als `limit` Elemente enthalten; verwenden Sie `nextCursor`, um fortzufahren.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth erforderlich:

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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Nur Admin:

- `POST /api/v1/users/reserve` reserviert Root-Slugs und private No-Release-Paketplatzhalter für ein Owner-Handle.

## Legacy

Legacy-`/api/*` und `/api/cli/*` sind weiterhin verfügbar. Siehe `DEPRECATIONS.md`.
