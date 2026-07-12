---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder der Weiterleitung von Anmeldedaten
    - Fehlerbehebung bei Modellauthentifizierungsfehlern oder der Profilreihenfolge
summary: Kanonische Semantik für die Berechtigung und Auflösung von Anmeldedaten für Authentifizierungsprofile
title: Semantik der Authentifizierungsdaten
x-i18n:
    generated_at: "2026-07-12T14:57:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Diese Semantik sorgt dafür, dass das Authentifizierungsverhalten bei der Auswahl und zur Laufzeit übereinstimmt. Sie wird gemeinsam verwendet von:

- `resolveAuthProfileOrder` (Profilreihenfolge)
- `resolveApiKeyForProfile` (Auflösung der Anmeldedaten zur Laufzeit)
- `openclaw models status --probe`
- Authentifizierungsprüfungen von `openclaw doctor` (`doctor-auth`)

## Stabile Ursachencodes für Prüfungen

Prüfergebnisse enthalten eine `status`-Kategorie (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) sowie einen stabilen `reasonCode`, wenn die Prüfung keinen Modellaufruf erreicht hat:

| `reasonCode`             | Bedeutung                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Das Profil ist in der expliziten Authentifizierungsreihenfolge seines Providers nicht enthalten.      |
| `missing_credential`     | Es sind weder direkt eingebettete Anmeldedaten noch eine SecretRef konfiguriert.                       |
| `expired`                | Der Wert `expires` des Tokens liegt in der Vergangenheit.                                             |
| `invalid_expires`        | `expires` ist kein gültiger positiver Unix-Zeitstempel in Millisekunden.                               |
| `unresolved_ref`         | Die konfigurierte SecretRef konnte nicht aufgelöst werden.                                            |
| `ineligible_profile`     | Das Profil ist mit der Provider-Konfiguration nicht kompatibel (einschließlich fehlerhafter Schlüsseleingabe). |
| `no_model`               | Anmeldedaten sind vorhanden, aber es wurde kein prüfbarer Modellkandidat aufgelöst.                    |

Berechtigungsprüfungen melden für verwendbare Anmeldedaten `ok` als Ursachencode.

## Token-Anmeldedaten

Token-Anmeldedaten (`type: "token"`) unterstützen direkt eingebettete Werte für `token` und/oder `tokenRef`.

### Berechtigungsregeln

1. Ein Token-Profil ist nicht berechtigt, wenn sowohl `token` als auch `tokenRef` fehlen (`missing_credential`).
2. `expires` ist optional. Falls vorhanden, muss es eine endliche Zahl von Millisekunden seit der Unix-Epoche sein, die größer als `0` und nicht größer als der maximale JavaScript-Zeitstempel für `Date` (8640000000000000) ist.
3. Wenn `expires` ungültig ist (falscher Typ, `NaN`, `0`, negativ, nicht endlich oder größer als dieser Maximalwert), ist das Profil mit `invalid_expires` nicht berechtigt.
4. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` nicht berechtigt.
5. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Semantik des Resolvers entspricht hinsichtlich `expires` der Berechtigungssemantik.
2. Für berechtigte Profile kann das Token-Material aus dem direkt eingebetteten Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Referenzen erzeugen in der Ausgabe von `models status --probe` den Wert `unresolved_ref`.

## Portabilität beim Kopieren von Agents

Die Vererbung der Agent-Authentifizierung erfolgt mit durchgereichtem Lesezugriff. Wenn ein Agent kein lokales Profil besitzt, löst er Profile zur Laufzeit aus dem Speicher des standardmäßigen bzw. Haupt-Agents auf, ohne geheimes Material in seinen eigenen Anmeldedatenspeicher (`agents/<agentId>/agent/openclaw-agent.sqlite`) zu kopieren.

Explizite Kopiervorgänge wie `openclaw agents add` verwenden diese Portabilitätsrichtlinie:

- Profile vom Typ `api_key` und `token` sind portabel, sofern nicht `copyToAgents: false` festgelegt ist.
- Profile vom Typ `oauth` sind standardmäßig nicht portabel, da Aktualisierungstokens möglicherweise nur einmal verwendbar oder empfindlich gegenüber Rotation sind.
- Provider-eigene OAuth-Abläufe dürfen sich nur mit `copyToAgents: true` dafür entscheiden, wenn das Kopieren von Aktualisierungsmaterial zwischen Agents nachweislich sicher ist; die Aktivierung gilt nur, wenn das Profil direkt eingebettetes Zugriffs-/Aktualisierungsmaterial enthält.

Nicht portable Profile bleiben durch die Vererbung mit durchgereichtem Lesezugriff verfügbar, sofern sich der Ziel-Agent nicht separat anmeldet und ein eigenes lokales Profil erstellt.

## Ausschließlich über die Konfiguration definierte Authentifizierungsrouten

Einträge in `auth.profiles` mit `mode: "aws-sdk"` sind Routing-Metadaten und keine gespeicherten Anmeldedaten. Sie sind gültig, wenn der Ziel-Provider `models.providers.<id>.auth: "aws-sdk"` verwendet. Diese Route wird von der Plugin-eigenen Einrichtung für Amazon Bedrock geschrieben. Diese Profil-IDs können in `auth.order` und Sitzungsüberschreibungen erscheinen, selbst wenn im Anmeldedatenspeicher kein entsprechender Eintrag vorhanden ist.

Schreiben Sie `type: "aws-sdk"` nicht in den Anmeldedatenspeicher; gespeicherte Anmeldedaten sind ausschließlich vom Typ `api_key`, `token` oder `oauth`. Wenn eine veraltete `auth-profiles.json` eine solche Markierung enthält, verschiebt `openclaw doctor --fix` sie nach `auth.profiles` und entfernt die Markierung aus dem Speicher.

## Explizite Filterung nach Authentifizierungsreihenfolge

- Wenn `auth.order.<provider>` oder die Reihenfolgeüberschreibung des Authentifizierungsspeichers für einen Provider festgelegt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Authentifizierungsreihenfolge für diesen Provider verbleiben. Die gespeicherte Überschreibung hat Vorrang vor der Konfiguration `auth.order`.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge fehlt, wird später nicht stillschweigend ausprobiert. Die Prüfungsausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung des Prüfungsziels

- Prüfungsziele können aus Authentifizierungsprofilen, Anmeldedaten aus der Umgebung oder `models.json` stammen (`source` des Ergebnisses: `profile`, `env`, `models.json`).
- Wenn ein Provider über Anmeldedaten verfügt, OpenClaw dafür jedoch keinen prüfbaren Modellkandidaten auflösen kann, meldet `models status --probe` den Wert `status: no_model` mit `reasonCode: no_model`.

## Ermittlung von Anmeldedaten externer CLIs

- Ausschließlich zur Laufzeit verfügbare Anmeldedaten, die externen CLIs gehören (Claude CLI für `claude-cli`, Codex CLI für `openai`, MiniMax CLI für `minimax-portal`), werden nur ermittelt, wenn der Provider, die Laufzeit oder das Authentifizierungsprofil für den aktuellen Vorgang relevant ist oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle vorhanden ist.
- Aufrufer des Authentifizierungsspeichers wählen einen expliziten Ermittlungsmodus für externe CLIs: `none` ausschließlich für persistierte/Plugin-Authentifizierung, `existing` zum Aktualisieren bereits gespeicherter externer CLI-Profile oder `scoped` für eine konkrete Gruppe von Providern/Profilen.
- Schreibgeschützte Pfade und Statuspfade übergeben `allowKeychainPrompt: false`; sie verwenden ausschließlich dateibasierte Anmeldedaten externer CLIs und lesen oder verwenden keine Ergebnisse aus dem macOS-Schlüsselbund.

## Richtlinienschutz für OAuth-SecretRef

SecretRef-Eingaben sind ausschließlich für statische Anmeldedaten vorgesehen. OAuth-Anmeldedaten sind zur Laufzeit veränderlich (Aktualisierungsabläufe speichern rotierte Tokens), sodass OAuth-Material auf SecretRef-Basis den veränderlichen Zustand auf mehrere Speicher verteilen würde.

- Wenn die Anmeldedaten eines Profils `type: "oauth"` aufweisen, werden SecretRef-Objekte für sämtliche Anmeldedatenfelder dieses Profils abgelehnt.
- Wenn `auth.profiles.<id>.mode` den Wert `"oauth"` hat, werden SecretRef-basierte Eingaben für `keyRef`/`tokenRef` dieses Profils abgelehnt.
- Verstöße führen zu nicht behebbaren Fehlern (ausgelösten Fehlern) bei der Vorbereitung geheimer Daten während des Starts/Neuladens sowie in den Pfaden zur Profilauflösung.

## Mit älteren Versionen kompatible Meldungen

Für die Kompatibilität mit Skripten bleibt die erste Zeile von Prüfungsfehlern unverändert:

`Auth profile credentials are missing or expired.`

Benutzerfreundliche Details und der stabile Ursachencode folgen in nachfolgenden Zeilen im Format `↳ Auth reason [code]: ...`.

## Verwandte Themen

- [Verwaltung geheimer Daten](/de/gateway/secrets)
- [Authentifizierungsspeicher](/de/concepts/oauth)
