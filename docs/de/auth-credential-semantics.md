---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder der Weiterleitung von Anmeldedaten
    - Fehler bei der Modellauthentifizierung oder der Profilreihenfolge beheben
summary: Kanonische Semantik für die Eignung und Auflösung von Anmeldedaten für Authentifizierungsprofile
title: Semantik der Authentifizierungsdaten
x-i18n:
    generated_at: "2026-07-12T01:22:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Diese Semantik hält das Authentifizierungsverhalten zur Auswahlzeit und zur Laufzeit konsistent. Sie wird gemeinsam verwendet von:

- `resolveAuthProfileOrder` (Profilreihenfolge)
- `resolveApiKeyForProfile` (Auflösung von Anmeldedaten zur Laufzeit)
- `openclaw models status --probe`
- Authentifizierungsprüfungen von `openclaw doctor` (`doctor-auth`)

## Stabile Ursachencodes für Prüfungen

Prüfergebnisse enthalten eine `status`-Kategorie (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) sowie einen stabilen `reasonCode`, wenn die Prüfung keinen Modellaufruf erreicht hat:

| `reasonCode`             | Bedeutung                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Das Profil fehlt in der expliziten Authentifizierungsreihenfolge seines Providers.                 |
| `missing_credential`     | Es sind weder direkt eingebettete Anmeldedaten noch eine SecretRef konfiguriert.                    |
| `expired`                | `expires` des Tokens liegt in der Vergangenheit.                                                   |
| `invalid_expires`        | `expires` ist kein gültiger positiver Unix-Zeitstempel in Millisekunden.                            |
| `unresolved_ref`         | Die konfigurierte SecretRef konnte nicht aufgelöst werden.                                         |
| `ineligible_profile`     | Das Profil ist mit der Provider-Konfiguration nicht kompatibel (einschließlich fehlerhafter Schlüsselangaben). |
| `no_model`               | Anmeldedaten sind vorhanden, aber es wurde kein für die Prüfung geeignetes Modell ermittelt.        |

Eignungsprüfungen melden für verwendbare Anmeldedaten `ok` als Ursachencode.

## Token-Anmeldedaten

Token-Anmeldedaten (`type: "token"`) unterstützen direkt eingebettete `token`-Werte und/oder `tokenRef`.

### Eignungsregeln

1. Ein Token-Profil ist ungeeignet, wenn sowohl `token` als auch `tokenRef` fehlen (`missing_credential`).
2. `expires` ist optional. Falls vorhanden, muss es eine endliche Zahl von Millisekunden seit der Unix-Epoche sein, die größer als `0` und nicht größer als der maximale JavaScript-`Date`-Zeitstempel (8640000000000000) ist.
3. Wenn `expires` ungültig ist (falscher Typ, `NaN`, `0`, negativ, nicht endlich oder größer als dieses Maximum), ist das Profil mit `invalid_expires` ungeeignet.
4. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` ungeeignet.
5. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Semantik des Resolvers entspricht bei `expires` der Eignungssemantik.
2. Bei geeigneten Profilen kann das Token-Material aus dem direkt eingebetteten Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Referenzen führen in der Ausgabe von `models status --probe` zu `unresolved_ref`.

## Übertragbarkeit beim Kopieren von Agenten

Die Vererbung der Agenten-Authentifizierung erfolgt durch Durchgriff. Wenn ein Agent kein lokales Profil hat, löst er Profile zur Laufzeit aus dem Speicher des Standard-/Hauptagenten auf, ohne geheimes Material in seinen eigenen Anmeldedatenspeicher (`agents/<agentId>/agent/openclaw-agent.sqlite`) zu kopieren.

Explizite Kopiervorgänge wie `openclaw agents add` verwenden diese Übertragbarkeitsrichtlinie:

- Profile des Typs `api_key` und `token` sind übertragbar, sofern nicht `copyToAgents: false` festgelegt ist.
- Profile des Typs `oauth` sind standardmäßig nicht übertragbar, da Aktualisierungstoken nur einmal verwendbar oder empfindlich gegenüber Rotation sein können.
- Provider-eigene OAuth-Abläufe dürfen sich nur mit `copyToAgents: true` dafür entscheiden, wenn bekannt ist, dass das Kopieren von Aktualisierungsmaterial zwischen Agenten sicher ist; diese Aktivierung gilt nur, wenn das Profil direkt eingebettetes Zugriffs-/Aktualisierungsmaterial enthält.

Nicht übertragbare Profile bleiben durch Vererbung mit Durchgriff verfügbar, sofern sich der Zielagent nicht separat anmeldet und ein eigenes lokales Profil erstellt.

## Ausschließlich über die Konfiguration definierte Authentifizierungsrouten

Einträge in `auth.profiles` mit `mode: "aws-sdk"` sind Routing-Metadaten und keine gespeicherten Anmeldedaten. Sie sind gültig, wenn der Ziel-Provider `models.providers.<id>.auth: "aws-sdk"` verwendet – die Route, die die Plugin-eigene Amazon-Bedrock-Einrichtung schreibt. Diese Profil-IDs können in `auth.order` und Sitzungsüberschreibungen erscheinen, auch wenn im Anmeldedatenspeicher kein entsprechender Eintrag vorhanden ist.

Schreiben Sie `type: "aws-sdk"` nicht in den Anmeldedatenspeicher; gespeicherte Anmeldedaten sind ausschließlich `api_key`, `token` oder `oauth`. Wenn eine ältere `auth-profiles.json` eine solche Markierung enthält, verschiebt `openclaw doctor --fix` sie nach `auth.profiles` und entfernt die Markierung aus dem Speicher.

## Explizite Filterung der Authentifizierungsreihenfolge

- Wenn `auth.order.<provider>` oder die Reihenfolgeüberschreibung des Authentifizierungsspeichers für einen Provider festgelegt ist, prüft `models status --probe` nur Profil-IDs, die in der aufgelösten Authentifizierungsreihenfolge für diesen Provider verbleiben. Die gespeicherte Überschreibung hat Vorrang vor der Konfiguration `auth.order`.
- Ein für diesen Provider gespeichertes Profil, das in der expliziten Reihenfolge fehlt, wird später nicht stillschweigend ausprobiert. Die Prüfungsausgabe meldet es mit `reasonCode: excluded_by_auth_order` und dem Detail `Excluded by auth.order for this provider.`

## Auflösung des Prüfungsziels

- Prüfungsziele können aus Authentifizierungsprofilen, Umgebungs-Anmeldedaten oder `models.json` stammen (`source` des Ergebnisses: `profile`, `env`, `models.json`).
- Wenn für einen Provider Anmeldedaten vorhanden sind, OpenClaw jedoch kein für die Prüfung geeignetes Modell ermitteln kann, meldet `models status --probe` den Wert `status: no_model` mit `reasonCode: no_model`.

## Ermittlung von Anmeldedaten externer CLIs

- Ausschließlich zur Laufzeit verwendete Anmeldedaten, die externen CLIs gehören (Claude CLI für `claude-cli`, Codex CLI für `openai`, MiniMax CLI für `minimax-portal`), werden nur ermittelt, wenn der Provider, die Laufzeit oder das Authentifizierungsprofil für den aktuellen Vorgang relevant ist oder wenn bereits ein gespeichertes lokales Profil für diese externe Quelle vorhanden ist.
- Aufrufer des Authentifizierungsspeichers wählen einen expliziten Ermittlungsmodus für externe CLIs: `none` ausschließlich für persistierte/Plugin-Authentifizierung, `existing` zum Aktualisieren bereits gespeicherter Profile externer CLIs oder `scoped` für eine konkrete Provider-/Profilmenge.
- Schreibgeschützte Pfade und Statuspfade übergeben `allowKeychainPrompt: false`; sie verwenden ausschließlich dateibasierte Anmeldedaten externer CLIs und lesen oder verwenden keine Ergebnisse des macOS-Schlüsselbunds erneut.

## Richtlinienprüfung für OAuth-SecretRef

SecretRef-Eingaben sind ausschließlich für statische Anmeldedaten vorgesehen. OAuth-Anmeldedaten sind zur Laufzeit veränderlich (Aktualisierungsabläufe speichern rotierte Tokens dauerhaft), sodass OAuth-Material auf SecretRef-Basis den veränderlichen Zustand auf mehrere Speicher verteilen würde.

- Wenn die Profilanmeldedaten `type: "oauth"` haben, werden SecretRef-Objekte für jedes Anmeldedatenfeld dieses Profils abgelehnt.
- Wenn `auth.profiles.<id>.mode` den Wert `"oauth"` hat, werden SecretRef-basierte `keyRef`-/`tokenRef`-Eingaben für dieses Profil abgelehnt.
- Verstöße führen in den Pfaden zur Vorbereitung geheimer Daten beim Start/Neuladen und zur Profilauflösung zu harten Fehlern (ausgelösten Fehlern).

## Mit älteren Versionen kompatible Meldungen

Zur Skriptkompatibilität bleibt diese erste Zeile von Prüfungsfehlern unverändert:

`Auth profile credentials are missing or expired.`

Darauf folgen in weiteren Zeilen benutzerfreundliche Details und der stabile Ursachencode im Format `↳ Auth reason [code]: ...`.

## Verwandte Themen

- [Verwaltung geheimer Daten](/de/gateway/secrets)
- [Speicherung von Authentifizierungsdaten](/de/concepts/oauth)
