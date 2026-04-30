---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder am Routing von Anmeldedaten
    - Fehlersuche bei Modellauthentifizierungsfehlern oder der Profilreihenfolge
summary: Kanonische Semantik für die Zulässigkeit und Auflösung von Anmeldeinformationen für Authentifizierungsprofile
title: Semantik von Auth-Zugangsdaten
x-i18n:
    generated_at: "2026-04-30T06:38:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dieses Dokument definiert die kanonische Semantik für die Eignung und Auflösung von Zugangsdaten, die verwendet wird in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Ziel ist es, das Verhalten zur Auswahlzeit und zur Laufzeit aufeinander abzustimmen.

## Stabile Probe-Ursachencodes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-Zugangsdaten

Token-Zugangsdaten (`type: "token"`) unterstützen Inline-`token` und/oder `tokenRef`.

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
3. Nicht auflösbare Referenzen erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Portierbarkeit von Agent-Kopien

Die Auth-Vererbung von Agenten ist durchlesend. Wenn ein Agent kein lokales Profil hat, kann er Profile zur Laufzeit aus dem Standard-/Haupt-Agent-Speicher auflösen, ohne geheimes Material in seine eigene `auth-profiles.json` zu kopieren.

Explizite Kopierabläufe wie `openclaw agents add` verwenden diese Portierbarkeitsrichtlinie:

- `api_key`-Profile sind portierbar, außer `copyToAgents: false`.
- `token`-Profile sind portierbar, außer `copyToAgents: false`.
- `oauth`-Profile sind standardmäßig nicht portierbar, da Aktualisierungs-Token einmalig verwendbar oder rotationssensitiv sein können.
- Provider-eigene OAuth-Abläufe können sich mit `copyToAgents: true` nur dann dafür entscheiden, wenn bekannt ist, dass das Kopieren von Aktualisierungsmaterial zwischen Agenten sicher ist.

Nicht portierbare Profile bleiben über durchlesende Vererbung verfügbar, sofern sich der Ziel-Agent nicht separat anmeldet und ein eigenes lokales Profil erstellt.

## Explizite Auth-Reihenfolge-Filterung

- Wenn `auth.order.<provider>` oder die Auth-Speicher-Reihenfolgeüberschreibung für einen Provider festgelegt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Auth-Reihenfolge für diesen Provider verbleiben.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge ausgelassen wurde, wird später nicht stillschweigend versucht. Die Probe-Ausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung von Probe-Zielen

- Probe-Ziele können aus Auth-Profilen, Umgebungs-Zugangsdaten oder `models.json` stammen.
- Wenn ein Provider Zugangsdaten hat, OpenClaw dafür aber keinen prüfbaren Modellkandidaten auflösen kann, meldet `models status --probe` `status: no_model` mit `reasonCode: no_model`.

## Erkennung von Zugangsdaten externer CLIs

- Nur zur Laufzeit verwendete Zugangsdaten, die externen CLIs gehören, werden nur erkannt, wenn der Provider, die Laufzeit oder das Auth-Profil für den aktuellen Vorgang im Scope ist oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle vorhanden ist.
- Schreibgeschützte/Status-Pfade übergeben `allowKeychainPrompt: false`; sie verwenden nur dateibasierte Zugangsdaten externer CLIs und lesen oder verwenden keine Ergebnisse aus dem macOS-Schlüsselbund erneut.

## OAuth-SecretRef-Richtlinien-Guard

- SecretRef-Eingaben sind nur für statische Zugangsdaten vorgesehen.
- Wenn die Profil-Zugangsdaten `type: "oauth"` sind, werden SecretRef-Objekte für dieses Profil-Zugangsdatenmaterial nicht unterstützt.
- Wenn `auth.profiles.<id>.mode` `"oauth"` ist, wird SecretRef-gestützte `keyRef`/`tokenRef`-Eingabe für dieses Profil abgelehnt.
- Verstöße sind harte Fehler in Auth-Auflösungspfaden beim Start/Neuladen.

## Legacy-kompatible Meldungen

Für Skriptkompatibilität behalten Probe-Fehler diese erste Zeile unverändert bei:

`Auth profile credentials are missing or expired.`

Benutzerfreundliche Details und stabile Ursachencodes können in nachfolgenden Zeilen hinzugefügt werden.

## Verwandte Themen

- [Geheimnisverwaltung](/de/gateway/secrets)
- [Auth-Speicher](/de/concepts/oauth)
