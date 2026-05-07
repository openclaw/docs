---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder am Routing von Zugangsdaten
    - Debuggen von Fehlern bei der Modellauthentifizierung oder der Profilreihenfolge
summary: Kanonische Eignung von Anmeldeinformationen und Auflösungssemantik für Authentifizierungsprofile
title: Semantik der Authentifizierungsdaten
x-i18n:
    generated_at: "2026-05-07T13:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dieses Dokument definiert die kanonischen Semantiken für Berechtigungsfähigkeit und Auflösung von Anmeldedaten, die verwendet werden in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Das Ziel ist, das Verhalten bei der Auswahl und zur Laufzeit konsistent zu halten.

## Stabile Probe-Ursachencodes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-Anmeldedaten

Token-Anmeldedaten (`type: "token"`) unterstützen inline `token` und/oder `tokenRef`.

### Regeln für die Berechtigungsfähigkeit

1. Ein Token-Profil ist nicht berechtigt, wenn sowohl `token` als auch `tokenRef` fehlen.
2. `expires` ist optional.
3. Wenn `expires` vorhanden ist, muss es eine endliche Zahl größer als `0` sein.
4. Wenn `expires` ungültig ist (`NaN`, `0`, negativ, nicht endlich oder falscher Typ), ist das Profil mit `invalid_expires` nicht berechtigt.
5. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` nicht berechtigt.
6. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Resolver-Semantik entspricht der Berechtigungssemantik für `expires`.
2. Für berechtigte Profile kann Token-Material aus einem Inline-Wert oder `tokenRef` aufgelöst werden.
3. Nicht auflösbare Referenzen erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Portabilität von Agent-Kopien

Die Auth-Vererbung von Agenten erfolgt per Durchgriff. Wenn ein Agent kein lokales Profil hat, kann er zur Laufzeit Profile aus dem Standard-/Haupt-Agentenspeicher auflösen, ohne geheimes Material in seine eigene `auth-profiles.json` zu kopieren.

Explizite Kopierabläufe wie `openclaw agents add` verwenden diese Portabilitätsrichtlinie:

- `api_key`-Profile sind portabel, sofern nicht `copyToAgents: false` gesetzt ist.
- `token`-Profile sind portabel, sofern nicht `copyToAgents: false` gesetzt ist.
- `oauth`-Profile sind standardmäßig nicht portabel, da Refresh-Tokens nur einmal verwendbar oder rotationssensitiv sein können.
- Provider-eigene OAuth-Abläufe können nur mit `copyToAgents: true` optieren, wenn bekannt ist, dass das Kopieren von Refresh-Material zwischen Agenten sicher ist.

Nicht portable Profile bleiben über die Durchgriffsvererbung verfügbar, sofern sich der Ziel-Agent nicht separat anmeldet und sein eigenes lokales Profil erstellt.

## Reine Konfigurations-Auth-Routen

`auth.profiles`-Einträge mit `mode: "aws-sdk"` sind Routing-Metadaten, keine gespeicherten Anmeldedaten. Sie sind gültig, wenn der Ziel-Provider `models.providers.<id>.auth: "aws-sdk"` oder die integrierte Standardroute des AWS SDK für Amazon Bedrock verwendet. Diese Profil-IDs können in `auth.order` und Sitzungsüberschreibungen erscheinen, auch wenn kein passender Eintrag in `auth-profiles.json` vorhanden ist.

Schreiben Sie `type: "aws-sdk"` nicht in `auth-profiles.json`. Wenn eine Legacy-Installation eine solche Markierung enthält, verschiebt `openclaw doctor --fix` sie nach `auth.profiles` und entfernt die Markierung aus dem Anmeldedatenspeicher.

## Explizite Filterung der Auth-Reihenfolge

- Wenn `auth.order.<provider>` oder die Überschreibung der Auth-Speicher-Reihenfolge für einen Provider gesetzt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Auth-Reihenfolge für diesen Provider verbleiben.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge ausgelassen wurde, wird später nicht stillschweigend ausprobiert. Die Probe-Ausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung von Probe-Zielen

- Probe-Ziele können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
- Wenn ein Provider über Anmeldedaten verfügt, OpenClaw aber keinen probe-fähigen Modellkandidaten dafür auflösen kann, meldet `models status --probe` `status: no_model` mit `reasonCode: no_model`.

## Erkennung von Anmeldedaten externer CLIs

- Nur zur Laufzeit verwendete Anmeldedaten, die externen CLIs gehören, werden nur erkannt, wenn der Provider, die Laufzeit oder das Auth-Profil für den aktuellen Vorgang im Geltungsbereich ist oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle existiert.
- Aufrufer des Auth-Speichers sollten einen expliziten Erkennungsmodus für externe CLIs wählen: `none` nur für persistierte/Plugin-Auth, `existing` zum Aktualisieren bereits gespeicherter externer CLI-Profile oder `scoped` für eine konkrete Provider-/Profilmenge.
- Schreibgeschützte/Status-Pfade übergeben `allowKeychainPrompt: false`; sie verwenden nur dateibasierte externe CLI-Anmeldedaten und lesen oder verwenden keine Ergebnisse aus dem macOS Keychain erneut.

## OAuth SecretRef Policy Guard

- SecretRef-Eingabe ist nur für statische Anmeldedaten vorgesehen.
- Wenn Anmeldedaten eines Profils `type: "oauth"` sind, werden SecretRef-Objekte für das Anmeldedatenmaterial dieses Profils nicht unterstützt.
- Wenn `auth.profiles.<id>.mode` `"oauth"` ist, wird SecretRef-gestützte `keyRef`/`tokenRef`-Eingabe für dieses Profil abgelehnt.
- Verstöße sind harte Fehler in Auth-Auflösungspfaden beim Start oder Neuladen.

## Legacy-kompatible Meldungen

Für Skriptkompatibilität bleibt diese erste Zeile bei Probe-Fehlern unverändert:

`Auth profile credentials are missing or expired.`

Menschenfreundliche Details und stabile Ursachencodes können in nachfolgenden Zeilen hinzugefügt werden.

## Verwandte Themen

- [Secrets-Verwaltung](/de/gateway/secrets)
- [Auth-Speicherung](/de/concepts/oauth)
