---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder am Routing von Anmeldedaten
    - Fehlersuche bei Modell-Authentifizierungsfehlern oder der Profilreihenfolge
summary: Kanonische Eignung von Anmeldeinformationen und Auflösungssemantik für Authentifizierungsprofile
title: Semantik der Authentifizierungsdaten
x-i18n:
    generated_at: "2026-04-30T21:02:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dieses Dokument definiert die kanonische Semantik für die Zulässigkeit und Auflösung von Anmeldeinformationen, die verwendet wird in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Das Ziel ist, das Verhalten bei der Auswahl und zur Laufzeit aufeinander abzustimmen.

## Stabile Prüfungs-Begründungscodes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-Anmeldeinformationen

Token-Anmeldeinformationen (`type: "token"`) unterstützen inline `token` und/oder `tokenRef`.

### Zulässigkeitsregeln

1. Ein Token-Profil ist unzulässig, wenn sowohl `token` als auch `tokenRef` fehlen.
2. `expires` ist optional.
3. Wenn `expires` vorhanden ist, muss es eine endliche Zahl größer als `0` sein.
4. Wenn `expires` ungültig ist (`NaN`, `0`, negativ, nicht endlich oder falscher Typ), ist das Profil mit `invalid_expires` unzulässig.
5. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` unzulässig.
6. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Resolver-Semantik entspricht der Zulässigkeitssemantik für `expires`.
2. Bei zulässigen Profilen kann Token-Material aus einem Inline-Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Referenzen erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Portabilität beim Kopieren von Agenten

Die Auth-Vererbung für Agenten wird beim Lesen durchgereicht. Wenn ein Agent kein lokales Profil hat, kann er zur Laufzeit Profile aus dem Standard-/Hauptspeicher des Agenten auflösen, ohne geheimes Material in seine eigene `auth-profiles.json` zu kopieren.

Explizite Kopierabläufe wie `openclaw agents add` verwenden diese Portabilitätsrichtlinie:

- `api_key`-Profile sind portabel, sofern nicht `copyToAgents: false` gesetzt ist.
- `token`-Profile sind portabel, sofern nicht `copyToAgents: false` gesetzt ist.
- `oauth`-Profile sind standardmäßig nicht portabel, da Aktualisierungstoken nur einmal verwendbar oder rotationsempfindlich sein können.
- Provider-eigene OAuth-Abläufe können sich nur dann mit `copyToAgents: true` anmelden, wenn bekannt ist, dass das Kopieren von Aktualisierungsmaterial über Agenten hinweg sicher ist.

Nicht portable Profile bleiben über die durchgereichte Vererbung verfügbar, sofern sich der Ziel-Agent nicht separat anmeldet und sein eigenes lokales Profil erstellt.

## Explizite Auth-Reihenfolgenfilterung

- Wenn `auth.order.<provider>` oder die Reihenfolgenüberschreibung des Auth-Speichers für einen Provider gesetzt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Auth-Reihenfolge für diesen Provider verbleiben.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge ausgelassen wird, wird später nicht stillschweigend ausprobiert. Die Prüfungsausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung von Prüfungszielen

- Prüfungsziele können aus Auth-Profilen, Umgebungs-Anmeldeinformationen oder `models.json` stammen.
- Wenn ein Provider über Anmeldeinformationen verfügt, OpenClaw aber keinen prüfbaren Modellkandidaten dafür auflösen kann, meldet `models status --probe` den Wert `status: no_model` mit `reasonCode: no_model`.

## Erkennung von Anmeldeinformationen externer CLIs

- Nur zur Laufzeit verwendete Anmeldeinformationen, die externen CLIs gehören, werden nur erkannt, wenn der Provider, die Laufzeit oder das Auth-Profil für den aktuellen Vorgang im Geltungsbereich liegt oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle existiert.
- Aufrufer des Auth-Speichers sollten einen expliziten Erkennungsmodus für externe CLIs wählen: `none` nur für persistierte/Plugin-Auth, `existing` zum Aktualisieren bereits gespeicherter externer CLI-Profile oder `scoped` für eine konkrete Provider-/Profilgruppe.
- Schreibgeschützte Statuspfade übergeben `allowKeychainPrompt: false`; sie verwenden nur dateibasierte externe CLI-Anmeldeinformationen und lesen oder verwenden keine Ergebnisse aus dem macOS-Schlüsselbund.

## Richtlinienschutz für OAuth-SecretRef

- SecretRef-Eingaben sind nur für statische Anmeldeinformationen vorgesehen.
- Wenn die Profil-Anmeldeinformation `type: "oauth"` ist, werden SecretRef-Objekte für das Material dieser Profil-Anmeldeinformationen nicht unterstützt.
- Wenn `auth.profiles.<id>.mode` den Wert `"oauth"` hat, werden SecretRef-basierte `keyRef`-/`tokenRef`-Eingaben für dieses Profil abgelehnt.
- Verstöße sind harte Fehler in Auth-Auflösungspfaden beim Starten oder Neuladen.

## Legacy-kompatible Meldungen

Aus Gründen der Skript-Kompatibilität behalten Prüfungsfehler diese erste Zeile unverändert bei:

`Auth profile credentials are missing or expired.`

Benutzerfreundliche Details und stabile Begründungscodes können in nachfolgenden Zeilen hinzugefügt werden.

## Verwandte Themen

- [Geheimnisverwaltung](/de/gateway/secrets)
- [Auth-Speicherung](/de/concepts/oauth)
