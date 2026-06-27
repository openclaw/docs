---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder am Routing von Zugangsdaten
    - Fehlerbehebung bei Modell-Authentifizierungsfehlern oder der Profilreihenfolge
summary: Kanonische Berechtigungs- und Auflösungssemantik für Auth-Profile
title: Semantik von Auth-Anmeldedaten
x-i18n:
    generated_at: "2026-06-27T17:08:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dieses Dokument definiert die kanonischen Semantiken für die Eignung und Auflösung von Zugangsdaten, die verwendet werden in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Ziel ist es, das Verhalten zur Auswahlzeit und zur Laufzeit konsistent zu halten.

## Stabile Probe-Reason-Codes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-Zugangsdaten

Token-Zugangsdaten (`type: "token"`) unterstützen inline `token` und/oder `tokenRef`.

### Eignungsregeln

1. Ein Token-Profil ist nicht geeignet, wenn sowohl `token` als auch `tokenRef` fehlen.
2. `expires` ist optional.
3. Wenn `expires` vorhanden ist, muss es eine endliche Zahl größer als `0` sein.
4. Wenn `expires` ungültig ist (`NaN`, `0`, negativ, nicht endlich oder falscher Typ), ist das Profil mit `invalid_expires` nicht geeignet.
5. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` nicht geeignet.
6. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Resolver-Semantik entspricht der Eignungssemantik für `expires`.
2. Für geeignete Profile kann Token-Material aus einem Inline-Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Refs erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Portabilität von Agent-Kopien

Die Auth-Vererbung von Agents erfolgt per Read-through. Wenn ein Agent kein lokales Profil hat, kann er zur Laufzeit Profile aus dem Standard-/Haupt-Agent-Speicher auflösen, ohne geheimes Material in seine eigene `auth-profiles.json` zu kopieren.

Explizite Kopierabläufe wie `openclaw agents add` verwenden diese Portabilitätsrichtlinie:

- `api_key`-Profile sind portabel, außer `copyToAgents: false`.
- `token`-Profile sind portabel, außer `copyToAgents: false`.
- `oauth`-Profile sind standardmäßig nicht portabel, weil Refresh-Tokens nur einmal verwendbar oder rotationssensibel sein können.
- Provider-eigene OAuth-Abläufe können sich nur dann mit `copyToAgents: true` anmelden, wenn bekannt ist, dass das Kopieren von Refresh-Material zwischen Agents sicher ist.

Nicht portable Profile bleiben über Read-through-Vererbung verfügbar, sofern sich der Ziel-Agent nicht separat anmeldet und sein eigenes lokales Profil erstellt.

## Reine Konfigurations-Auth-Routen

`auth.profiles`-Einträge mit `mode: "aws-sdk"` sind Routing-Metadaten, keine gespeicherten Zugangsdaten. Sie sind gültig, wenn der Ziel-Provider `models.providers.<id>.auth: "aws-sdk"` oder die Plugin-eigene AWS-SDK-Route für die Einrichtung von Amazon Bedrock verwendet. Diese Profil-IDs können in `auth.order` und Sitzungs-Overrides erscheinen, auch wenn kein passender Eintrag in `auth-profiles.json` vorhanden ist.

Schreiben Sie `type: "aws-sdk"` nicht in `auth-profiles.json`. Wenn eine Legacy-Installation eine solche Markierung enthält, verschiebt `openclaw doctor --fix` sie nach `auth.profiles` und entfernt die Markierung aus dem Zugangsdaten-Speicher.

## Explizite Auth-Order-Filterung

- Wenn `auth.order.<provider>` oder der Auth-Store-Order-Override für einen Provider gesetzt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Auth-Order für diesen Provider verbleiben.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Order ausgelassen wurde, wird später nicht stillschweigend ausprobiert. Die Probe-Ausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung von Probe-Zielen

- Probe-Ziele können aus Auth-Profilen, Umgebungs-Zugangsdaten oder `models.json` stammen.
- Wenn ein Provider Zugangsdaten hat, OpenClaw dafür aber keinen prüfbaren Modellkandidaten auflösen kann, meldet `models status --probe` `status: no_model` mit `reasonCode: no_model`.

## Erkennung von Zugangsdaten externer CLIs

- Reine Laufzeit-Zugangsdaten, die externen CLIs gehören, werden nur erkannt, wenn der Provider, die Laufzeit oder das Auth-Profil für den aktuellen Vorgang im Geltungsbereich liegt oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle vorhanden ist.
- Auth-Store-Aufrufer sollten einen expliziten Erkennungsmodus für externe CLIs wählen: `none` nur für persistierte/Plugin-Auth, `existing` zum Aktualisieren bereits gespeicherter externer CLI-Profile oder `scoped` für eine konkrete Provider-/Profilmenge.
- Read-only-/Statuspfade übergeben `allowKeychainPrompt: false`; sie verwenden nur dateibasierte externe CLI-Zugangsdaten und lesen oder verwenden keine Ergebnisse aus dem macOS-Schlüsselbund wieder.

## Richtlinien-Guard für OAuth-SecretRef

- SecretRef-Eingabe ist nur für statische Zugangsdaten vorgesehen.
- Wenn Zugangsdaten eines Profils `type: "oauth"` sind, werden SecretRef-Objekte für das Zugangsdatenmaterial dieses Profils nicht unterstützt.
- Wenn `auth.profiles.<id>.mode` `"oauth"` ist, wird SecretRef-gestützte `keyRef`-/`tokenRef`-Eingabe für dieses Profil abgelehnt.
- Verstöße sind harte Fehler in Auth-Auflösungspfaden beim Start oder Neuladen.

## Legacy-kompatible Meldungen

Für Skriptkompatibilität bleibt diese erste Zeile bei Probe-Fehlern unverändert:

`Auth profile credentials are missing or expired.`

Menschenfreundliche Details und stabile Reason-Codes können in nachfolgenden Zeilen hinzugefügt werden.

## Verwandte Themen

- [Secrets-Verwaltung](/de/gateway/secrets)
- [Auth-Speicher](/de/concepts/oauth)
