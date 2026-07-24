---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder der Weiterleitung von Anmeldedaten
    - Fehlerbehebung bei Modellauthentifizierungsfehlern oder der Profilreihenfolge
summary: Kanonische Semantik für die Eignung und Auflösung von Anmeldedaten für Authentifizierungsprofile
title: Semantik der Authentifizierungsdaten
x-i18n:
    generated_at: "2026-07-24T04:14:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Diese Semantik hält das Authentifizierungsverhalten zum Auswahlzeitpunkt und zur Laufzeit konsistent. Sie wird gemeinsam verwendet von:

- `resolveAuthProfileOrder` (Profilreihenfolge)
- `resolveApiKeyForProfile` (Auflösung von Anmeldedaten zur Laufzeit)
- `openclaw models status --probe`
- `openclaw doctor`-Authentifizierungsprüfungen (`doctor-auth`)

## Stabile Ursachencodes für Prüfungen

Prüfergebnisse enthalten eine `status`-Kategorie (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) sowie einen stabilen `reasonCode`-Wert, wenn die Prüfung keinen Modellaufruf erreicht hat:

| `reasonCode`             | Bedeutung                                                                    |
| ------------------------ | ---------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Das Profil fehlt in der expliziten Authentifizierungsreihenfolge seines Providers. |
| `missing_credential`     | Es sind weder direkte Anmeldedaten noch eine SecretRef konfiguriert.          |
| `expired`                | Der Token-Zeitpunkt `expires` liegt in der Vergangenheit.                    |
| `invalid_expires`        | `expires` ist kein gültiger positiver Unix-Zeitstempel in ms.                |
| `unresolved_ref`         | Die konfigurierte SecretRef konnte nicht aufgelöst werden.                    |
| `ineligible_profile`     | Das Profil ist mit der Provider-Konfiguration inkompatibel (einschließlich fehlerhafter Schlüsseleingaben). |
| `no_model`               | Anmeldedaten sind vorhanden, aber es wurde kein prüfbarer Modellkandidat aufgelöst. |

Berechtigungsprüfungen melden `ok` als Ursachencode für verwendbare Anmeldedaten.

## Token-Anmeldedaten

Token-Anmeldedaten (`type: "token"`) unterstützen direkte `token` und/oder `tokenRef`.

### Berechtigungsregeln

1. Ein Token-Profil ist nicht berechtigt, wenn sowohl `token` als auch `tokenRef` fehlen (`missing_credential`).
2. `expires` ist optional. Wenn vorhanden, muss der Wert eine endliche Zahl von Millisekunden seit der Unix-Epoche sein, die größer als `0` und nicht größer als der maximale JavaScript-Zeitstempel `Date` (8640000000000000) ist.
3. Wenn `expires` ungültig ist (falscher Typ, `NaN`, `0`, negativ, nicht endlich oder größer als dieser Höchstwert), ist das Profil mit `invalid_expires` nicht berechtigt.
4. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` nicht berechtigt.
5. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Semantik des Resolvers entspricht für `expires` der Berechtigungssemantik.
2. Bei berechtigten Profilen kann das Token-Material aus dem direkten Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Referenzen erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Portabilität von Agent-Kopien

Die Vererbung der Agent-Authentifizierung erfolgt durch Durchgriff. Wenn ein Agent kein lokales Profil hat, löst er Profile zur Laufzeit aus dem Speicher des Standard-/Haupt-Agenten auf, ohne geheimes Material in seinen eigenen Anmeldedatenspeicher zu kopieren (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Explizite Kopiervorgänge wie `openclaw agents add` verwenden diese Portabilitätsrichtlinie:

- `api_key`- und `token`-Profile sind portabel, sofern nicht `copyToAgents: false`.
- `oauth`-Profile sind standardmäßig nicht portabel, da Aktualisierungstoken nur einmal verwendbar oder rotationsabhängig sein können.
- Provider-eigene OAuth-Abläufe können sich mit `copyToAgents: true` nur dann dafür entscheiden, wenn bekannt ist, dass das Kopieren von Aktualisierungsmaterial zwischen Agenten sicher ist; die Aktivierung gilt nur, wenn das Profil direktes Zugriffs-/Aktualisierungsmaterial enthält.

Nicht portable Profile bleiben durch die Vererbung per Durchgriff verfügbar, sofern sich der Ziel-Agent nicht separat anmeldet und ein eigenes lokales Profil erstellt.

## Reine Konfigurationsrouten für die Authentifizierung

`auth.profiles`-Einträge mit `mode: "aws-sdk"` sind Routing-Metadaten und keine gespeicherten Anmeldedaten. Sie sind gültig, wenn der Ziel-Provider `models.providers.<id>.auth: "aws-sdk"` verwendet, also die Route, die die Plugin-eigene Amazon-Bedrock-Einrichtung schreibt. Diese Profil-IDs können in `auth.order` und Sitzungsüberschreibungen erscheinen, auch wenn im Anmeldedatenspeicher kein entsprechender Eintrag vorhanden ist.

Schreiben Sie `type: "aws-sdk"` nicht in den Anmeldedatenspeicher; gespeicherte Anmeldedaten sind ausschließlich `api_key`, `token` oder `oauth`. Wenn ein älterer `auth-profiles.json` einen solchen Marker enthält, verschiebt `openclaw doctor --fix` ihn nach `auth.profiles` und entfernt den Marker aus dem Speicher.

## Filterung nach expliziter Authentifizierungsreihenfolge

- Wenn `auth.order.<provider>` oder die Reihenfolgenüberschreibung des Authentifizierungsspeichers für einen Provider festgelegt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Authentifizierungsreihenfolge dieses Providers verbleiben. Die gespeicherte Überschreibung hat Vorrang vor der `auth.order`-Konfiguration.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge fehlt, wird später nicht stillschweigend ausprobiert. Die Prüfausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung des Prüfungsziels

- Prüfungsziele können aus Authentifizierungsprofilen, Umgebungsanmeldedaten oder `models.json` stammen (Ergebnis `source`: `profile`, `env`, `models.json`).
- Wenn ein Provider über Anmeldedaten verfügt, OpenClaw dafür aber keinen prüfbaren Modellkandidaten auflösen kann, meldet `models status --probe` den Wert `status: no_model` mit `reasonCode: no_model`.

## Ermittlung von Anmeldedaten externer CLIs

- Nur zur Laufzeit verfügbare Anmeldedaten, die externen CLIs gehören (Claude CLI für `claude-cli`, Codex CLI für `openai`, MiniMax CLI für `minimax-portal`), werden nur ermittelt, wenn der Provider, die Laufzeit oder das Authentifizierungsprofil für den aktuellen Vorgang relevant ist oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle vorhanden ist.
- Aufrufer des Authentifizierungsspeichers wählen einen expliziten Ermittlungsmodus für externe CLIs: `none` ausschließlich für persistierte/Plugin-Authentifizierung, `existing` zum Aktualisieren bereits gespeicherter externer CLI-Profile oder `scoped` für eine konkrete Provider-/Profilmenge.
- Schreibgeschützte Pfade und Statuspfade übergeben `allowKeychainPrompt: false`; sie verwenden ausschließlich dateibasierte Anmeldedaten externer CLIs und lesen oder verwenden keine Ergebnisse aus dem macOS-Schlüsselbund erneut.

## Schutzrichtlinie für OAuth-SecretRefs

SecretRef-Eingaben sind ausschließlich für statische Anmeldedaten vorgesehen. OAuth-Anmeldedaten sind zur Laufzeit veränderlich (Aktualisierungsabläufe speichern rotierte Token dauerhaft), daher würde SecretRef-gestütztes OAuth-Material den veränderlichen Zustand auf mehrere Speicher verteilen.

- Wenn die Anmeldedaten eines Profils `type: "oauth"` sind, werden SecretRef-Objekte für jedes Feld mit Anmeldedatenmaterial dieses Profils abgelehnt.
- Wenn `auth.profiles.<id>.mode` den Wert `"oauth"` hat, werden SecretRef-gestützte `keyRef`-/`tokenRef`-Eingaben für dieses Profil abgelehnt.
- Verstöße führen in den Pfaden zur Vorbereitung geheimer Daten beim Start/Neuladen und zur Profilauflösung zu harten Fehlern (ausgelösten Fehlern).

## Mit älteren Versionen kompatible Meldungen

Aus Gründen der Skriptkompatibilität bleibt diese erste Zeile bei Prüfungsfehlern unverändert:

`Auth profile credentials are missing or expired.`

Benutzerfreundliche Details und der stabile Ursachencode folgen in nachfolgenden Zeilen im Format `↳ Auth reason [code]: ...`.

## Verwandte Themen

- [Verwaltung geheimer Daten](/de/gateway/secrets)
- [Authentifizierungsspeicher](/de/concepts/oauth)
