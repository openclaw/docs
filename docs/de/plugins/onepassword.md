---
read_when:
    - Sie möchten, dass Agenten kuratierte 1Password-Geheimnisse anfordern
    - Sie benötigen eine Genehmigungsrichtlinie und einen Prüfverlauf für jedes Secret.
    - Sie konfigurieren ein 1Password-Dienstkonto für OpenClaw
summary: Verwenden Sie das optionale 1Password-Plugin als geprüften Secrets-Broker für Agenten
title: 1Password-Secrets-Broker
x-i18n:
    generated_at: "2026-07-24T05:14:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 255ab4fd2c63754fef29d3ea87dcedc9ca2bd2f34bec1f81139e2ce5b6acdba2
    source_path: plugins/onepassword.md
    workflow: 16
---

# 1Password-Secrets-Broker

Das gebündelte Plugin `onepassword` stellt Agenten ein richtliniengesteuertes Werkzeug zum
Lesen einer kuratierten Auswahl von 1Password-Feldern bereit. Es ist standardmäßig deaktiviert und führt
keine Aktionen aus, solange `plugins.entries.onepassword.config` nicht vorhanden ist.

Dies ist ein Agentenwerkzeug, kein SecretRef-Provider. Es injiziert keine Umgebungsvariablen
und löst keine Geheimnisse aus der OpenClaw-Konfiguration auf.

## Sicherheitsmodell

- Nur Dienstkontoauthentifizierung. Das Token verbleibt in einer lokalen Anmeldedatendatei
  und wird in `openclaw.json` niemals akzeptiert.
- Nur kuratiertes Register. Agenten können konfigurierte Slugs auflisten, aber das Plugin
  listet niemals den Inhalt eines 1Password-Tresors auf.
- Richtlinie `auto`, `approve` oder `deny` pro Slug.
- Genehmigungen laufen ab. Ein zwischengespeicherter Wert umgeht niemals die aktuelle Richtlinie.
- Jeder Zugriffsversuch wird im gemeinsamen SQLite-Status von OpenClaw aufgezeichnet. Audit-
  Zeilen enthalten die angegebene Begründung; halten Sie Begründungen frei von vertraulichen Daten. Der Broker
  kopiert weder einen abgerufenen Wert noch das Dienst-Token in eine Audit-Zeile.
- Nach der aktuellen Werkzeugausführung ersetzt die von OpenClaw verwaltete Transkriptpersistenz
  einen erfolgreichen Wert von `get` durch geschwärzte Metadaten.
- Der Wert ist für das Modell während dieser Ausführung sichtbar. Wenn das Modell ihn in einen
  späteren Werkzeugaufruf oder eine Antwort kopiert, liegt dieser separate Datensatz außerhalb des
  Persistenz-Hooks dieses Plugins. Halten Sie Richtlinien eng gefasst und fordern Sie das Modell nicht auf,
  einen Wert wiederzugeben.
- Das Plugin ruft `op` bei jedem Cache-Fehlschlag einmal auf. Bei Ratenbegrenzungen oder
  anderen Fehlern erfolgt kein erneuter Versuch.
- Jeder Aufruf von `op` wird mit einer minimalen Umgebung ausgeführt, welche die Integration
  mit der 1Password-Desktop-App deaktiviert (`OP_LOAD_DESKTOP_APP_SETTINGS=false`,
  `OP_BIOMETRIC_UNLOCK_ENABLED=false`), sodass eine auf dem
  Gateway-Host installierte 1Password-App niemals biometrische Dialoge oder macOS-Berechtigungsdialoge auslöst.

Gewähren Sie dem Dienstkonto nur Lesezugriff auf die Tresore und Elemente, die in
der Plugin-Konfiguration registriert sind.

## Vorbereitungen

Sie benötigen:

- die auf dem Gateway-Host installierte 1Password-CLI (`op`)
- ein 1Password-Dienstkonto mit Zugriff auf die ausgewählten Elemente
- eine dedizierte Token-Datei für das Dienstkonto

Aktivieren Sie das gebündelte Plugin:

```bash
openclaw plugins enable onepassword
```

Erstellen Sie das Token-Verzeichnis und die Datei im OpenClaw-Statusverzeichnis:

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

Wenn `OPENCLAW_STATE_DIR` gesetzt ist, ersetzen Sie `~/.openclaw` durch dieses Verzeichnis.
Das Plugin warnt einmalig, wenn die Token-Datei für die Gruppe oder
andere Benutzer lesbar oder beschreibbar ist.

## Registrierte Geheimnisse konfigurieren

Fügen Sie die Plugin-Konfiguration zu `openclaw.json` hinzu:

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

Slugs verwenden Kleinbuchstaben, Ziffern und Bindestriche, beginnen mit einem Buchstaben oder
einer Ziffer und umfassen höchstens 64 Zeichen. Ein Register kann bis zu 32
Slugs enthalten; Beschreibungen dürfen bis zu 200 Zeichen umfassen. `field` akzeptiert eine Feldbezeichnung
oder ID, darf kein Komma enthalten und verwendet standardmäßig `credential`.
Ein `vault` auf Elementebene überschreibt den Standardtresor. `opBin` kann einen absoluten
Pfad zur ausführbaren Datei `op` festlegen; andernfalls löst das Plugin `op` aus `PATH` auf.
Elementtitel dürfen nicht mit einem Bindestrich beginnen.

## Agentenwerkzeug verwenden

Der Werkzeugname lautet `onepassword`.

Registrierte Slugs auflisten:

```json
{ "action": "list" }
```

Das Ergebnis enthält nur den Slug, die Beschreibung, die Richtlinie und die Information, ob eine dauerhafte
Genehmigung aktiv ist. Es enthält niemals einen geheimen Wert und fragt 1Password nicht ab.

Ein Geheimnis anfordern:

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` ist erforderlich, darf nicht leer sein und ist auf 300 Zeichen begrenzt. Ein
erfolgreicher `get` gibt den Wert sowie den konfigurierten Slug, den Elementtitel und
die Feldbezeichnung zurück.

Das Werkzeugschema deklariert außerdem einen internen Parameter `authorizationNonce`. Die
Richtlinienebene injiziert ihn nach der Auswertung der Anfrage, um die Autorisierung
an den ausführenden Werkzeugaufruf zu übergeben. Legen Sie ihn niemals manuell fest: Der Richtlinien-Hook überschreibt
jeden angegebenen Wert, und ein unbekannter Wert lässt die Anfrage fehlschlagen.

## Richtlinienstufen und Genehmigungen

- `auto`: sofort abrufen und die Anfrage protokollieren.
- `deny`: die Anfrage blockieren und protokollieren.
- `approve`: eine nicht abgelaufene dauerhafte Genehmigung verwenden oder eine Person bitten, einmalig
  oder immer zu erlauben beziehungsweise abzulehnen.

Eine einmalige Erlaubnis autorisiert nur den aktuellen Werkzeugaufruf. Eine dauerhafte Erlaubnis schreibt eine dauerhafte
Genehmigung für diesen Agenten und Slug in SQLite; andere Agenten müssen eine eigene
Genehmigung erhalten. OpenClaw bietet die dauerhafte Erlaubnis nur an, wenn der Aufrufer über eine konkrete Agentenidentität
verfügt. Die Genehmigung läuft nach `grantTtlHours` ab, wobei der Standardwert 720 Stunden beträgt.
Eine nicht beantwortete oder wegen Zeitüberschreitung abgebrochene Genehmigungsanfrage lehnt die Anfrage ab; die maximale Wartezeit für eine Genehmigung
beträgt 600 Sekunden. Das Plugin bewahrt bis zu 1.024 dauerhafte Genehmigungen auf; bei Erreichen dieser
Grenze wird die älteste Genehmigung entfernt, und der zugehörige Agent muss den nächsten Zugriff genehmigen lassen.

Jede ausgewertete Autorisierung kann nur einmal verwendet werden und wird über den gemeinsamen SQLite-Status
an den ausführenden Werkzeugaufruf übergeben, sodass die Übergabe auch funktioniert, wenn mehr als eine
Plugin-Instanz im Gateway-Prozess aktiv ist. Nicht verwendete Autorisierungen laufen
nach dem 600-sekündigen Genehmigungsfenster ab.

Der In-Memory-Cache verwendet standardmäßig 300 Sekunden und ist durch das konfigurierte
Slug-Register begrenzt. Setzen Sie `cacheTtlSeconds` auf `0`, um ihn zu deaktivieren. Die Richtlinie wird
vor jedem Cache-Zugriff ausgewertet, und Cache-Treffer werden protokolliert. Das erneute Laden der Laufzeitkonfiguration
wird an jeder Richtlinien- und Ausführungsgrenze wirksam; das Deaktivieren des Plugins oder
das Entfernen, Ablehnen oder Neuzuordnen eines Slugs macht ausstehende Autorisierungen und
zwischengespeicherte Werte ungültig.

## Status und Audit-Verlauf prüfen

Bereitschaft und Registerzahlen anzeigen:

```bash
openclaw onepassword status
```

Dies meldet, ob die Token-Datei vorhanden ist, ob `op` aufgelöst wurde und unter welchem Pfad,
die Anzahl der registrierten Elemente sowie die Anzahl pro Richtlinie. Das Token oder geheime Werte werden
niemals gelesen oder ausgegeben.

Die 50 neuesten Audit-Zeilen anzeigen:

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

Die neuesten Zeilen stehen zuerst und zeigen Zeitstempel, Agent, Slug, Ergebnis, einen `errorCode`
bei einem fehlgeschlagenen Versuch sowie eine gekürzte Begründung. Die Begründung wird wie
angegeben gespeichert; der Broker fügt den abgerufenen Wert niemals zum Audit-Protokoll hinzu.

## Verhalten der 1Password-CLI

Bei jedem Cache-Fehlschlag wird `op item get` mit dem konfigurierten Element, Tresor und exakten
Feldselektor, JSON-Ausgabe, einer begrenzten Zeitüberschreitung und `--cache=false` ausgeführt. Der untergeordnete Prozess
erhält nur dieses Feld anstelle des vollständigen Elements. In der Umgebung des untergeordneten Prozesses sind nur
`OP_SERVICE_ACCOUNT_TOKEN` und `HOME` vorhanden.

Das Plugin führt einen Versuch aus. Fehler von `RATE_LIMITED` sollten behandelt werden, indem
vor einer späteren Agentenanfrage gewartet wird; das Plugin erstellt keine automatische Schleife
für erneute Versuche.

## Fehlercodes

Fehlgeschlagene Versuche enthalten einen abgeschlossenen Fehlercode im Werkzeugergebnis und in der Audit-
Zeile.

1Password-Zugriffsfehler:

| Code              | Bedeutung                                                        |
| ----------------- | ---------------------------------------------------------------- |
| `TOKEN_MISSING`   | Die Token-Datei fehlt oder ist leer                              |
| `OP_NOT_FOUND`    | Die Binärdatei `op` konnte nicht aufgelöst werden                      |
| `ITEM_NOT_FOUND`  | Das konfigurierte Element befindet sich nicht im Tresor          |
| `FIELD_NOT_FOUND` | Das konfigurierte Feld ist nicht im Element vorhanden; verfügbare Bezeichnungen werden aufgelistet |
| `RATE_LIMITED`    | Ratenbegrenzung für das 1Password-Dienstkonto erreicht           |
| `AUTH_FAILED`     | Dienstkontoauthentifizierung fehlgeschlagen                       |
| `TIMEOUT`         | `op` hat `opTimeoutMs` überschritten                              |
| `OP_ERROR`        | Jeder andere Fehler oder jede ungültige Ausgabe von `op`               |

Richtlinien- und Validierungsfehler:

| Code                                               | Bedeutung                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `INVALID_ACTION`, `INVALID_REASON`, `INVALID_SLUG` | Eingabevalidierung der Anfrage fehlgeschlagen                                |
| `UNKNOWN_SLUG`                                     | Der Slug befindet sich nicht im konfigurierten Register                       |
| `TOOL_CALL_ID_MISSING`                             | Der Aufruf ist ohne Werkzeugaufruf-ID eingegangen                             |
| `POLICY_NOT_EVALUATED`                             | Keine passende Autorisierung für diesen Aufruf; die Anfrage wurde nicht durch die Richtlinie genehmigt |
| `POLICY_CHANGED`                                   | Die Konfiguration wurde zwischen Genehmigung und Ausführung geändert          |
| `GRANT_EXPIRED`                                    | Die dauerhafte Genehmigung ist vor der Ausführung abgelaufen                   |
| `APPROVAL_CANCELLED`                               | Der Lauf wurde abgebrochen, während die Genehmigung ausstand                   |
