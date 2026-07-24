---
read_when:
    - Ein Client sieht `rate limit exceeded for <method>`, `AUTH_RATE_LIMITED` oder Sperrfehler
    - Sie möchten `gateway.auth.rateLimit` optimieren
    - Sie befassen sich mit dem Schutz vor Brute-Force-Angriffen auf einen öffentlich zugänglichen Gateway
    - Sie müssen wissen, welche Gateway-Oberflächen gedrosselt werden und welche Limits gelten.
summary: 'Referenz für sämtliche Gateway-Ratenbegrenzungen: Sperren vor der Authentifizierung, Browser- und Webhook-Drosselungen, die Absicherung für Schreibvorgänge auf der Steuerungsebene, ACP-Sitzungslimits und die Abklingzeit für Neustarts'
title: Ratenbegrenzung
x-i18n:
    generated_at: "2026-07-24T03:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7aa37b65347610bedfb1db8f661e7ba75ef3cdfed0ba73c4ce53d80acace1e48
    source_path: gateway/security/rate-limiting.md
    workflow: 16
---

Der Gateway erzwingt mehrere unabhängige Ratenbegrenzungen. Sie schützen unterschiedliche
Grenzen, verwenden unterschiedliche Identitäten als Schlüssel und schlagen mit unterschiedlichen Fehlerformaten fehl.
Diese Seite dient als Referenz für alle diese Begrenzungen.

Auf einen Blick:

| Oberfläche                          | Begrenzung (Standard)             | Schlüssel                         | Konfigurierbar          |
| ----------------------------------- | --------------------------------- | --------------------------------- | ----------------------- |
| Fehlgeschlagene Authentifizierung (Token/Passwort/Gerät) | 10 Fehlschläge / 60s, 5 min Sperre | IP + Anmeldedatenbereich          | `gateway.auth.rateLimit` |
| Browser-Origin-WS-Authentifizierungsfehler | identisch, Loopback **nicht** ausgenommen | IP oder Seiten-Origin bei Loopback | `gateway.auth.rateLimit` |
| Webhook-Authentifizierungsfehler (`/hooks`) | 20 Fehlschläge / 60s, 60s Sperre | IP                                | nein                    |
| Schreibende Control-Plane-RPCs      | 30 Anfragen / 60s pro Methode     | Methode + Gerät + IP              | nein                    |
| ACP-Sitzungserstellung              | 120 Sitzungen / 10s               | Übersetzerinstanz                 | intern                  |
| Gateway-Neustartzyklen              | 30s Abklingzeit zwischen Neustarts | Prozess                           | nein                    |

## Authentifizierungsversuche (vor der Authentifizierung)

Fehlgeschlagene Authentifizierungsversuche werden pro Client-IP gedrosselt, bevor eine
Anfrage verarbeitet wird. Dies ist der Brute-Force-Schutz für exponierte Gateways.

- Nur _falsche_ Anmeldedaten werden gezählt. Fehlende Anmeldedaten (ein Client, der nie
  ein Token gesendet hat) und erfolgreiche Authentifizierungen verbrauchen kein Kontingent; eine
  erfolgreiche Authentifizierung setzt den Zähler für diese IP zurück.
- Standardwerte: 10 Fehlschläge pro 60 Sekunden, anschließend eine 5-minütige Sperre für diese IP.
- Loopback (`127.0.0.1` / `::1`) ist standardmäßig ausgenommen, damit lokale CLI-Sitzungen
  nicht ausgesperrt werden können.
- Zähler gelten jeweils für eine Anmeldedatenklasse, sodass eine Flut gegen eine Oberfläche
  die andere nicht verdrängt. Zu den Bereichen gehören das gemeinsame Gateway-
  Token/Passwort, Gerätetoken, Node-Kopplung, erneute Genehmigung gekoppelter Nodes,
  Geräte-Bootstrap-Token und die Ausgabe von watchOS-Challenges.

Während der Sperre schlagen Verbindungsversuche wie folgt fehl:

```json
{
  "code": "INVALID_REQUEST",
  "message": "unauthorized: too many failed authentication attempts (retry later)",
  "retryable": true,
  "retryAfterMs": 297000,
  "details": {
    "code": "AUTH_RATE_LIMITED",
    "authReason": "rate_limited",
    "recommendedNextStep": "wait_then_retry"
  }
}
```

Versuche von anderen IPs (einschließlich Loopback) bleiben während einer Sperre unbeeinträchtigt.

Passen Sie die Einstellung unter `gateway.auth.rateLimit` in `openclaw.json` an:

```json
{
  "gateway": {
    "auth": {
      "rateLimit": {
        "maxAttempts": 10,
        "windowMs": 60000,
        "lockoutMs": 300000,
        "exemptLoopback": true
      }
    }
  }
}
```

Wiederholte `AUTH_RATE_LIMITED`-Einträge im Gateway-Protokoll bedeuten, dass jemand
Anmeldedaten errät; siehe das [Runbook für Exposition](/de/gateway/security/exposure-runbook).

### Verbindungen mit Browser-Origin

WebSocket-Verbindungen, die einen Browser-Header `Origin` enthalten, verwenden dieselben
Begrenzungen, jedoch ist die Loopback-Ausnahme **immer deaktiviert** — eine schädliche Seite in
einem lokalen Browser ist weiterhin ein nicht vertrauenswürdiger Client, daher erhält localhost auf
diesem Pfad keine Sonderbehandlung. Wenn eine solche Verbindung _von_ einer Loopback-Adresse eingeht, werden ihre
Fehlschläge anhand des normalisierten Seiten-Origins (zum Beispiel
`browser-origin:https://evil.example`) statt anhand der gemeinsamen Loopback-IP erfasst,
sodass jeder Origin einen eigenen Bucket erhält; bei Nicht-Loopback-Adressen bleibt
die Client-IP der Schlüssel. Dies ist nicht konfigurierbar.

### Webhooks

Der HTTP-Eingang `/hooks` verfügt über eine eigene Begrenzung für Fehlschläge: 20 fehlgeschlagene
Authentifizierungen pro 60 Sekunden und Client-IP, anschließend eine 60-sekündige Sperre.
Loopback ist nicht ausgenommen. Eine erfolgreiche Hook-Authentifizierung setzt den Zähler zurück. Gedrosselte
Anfragen erhalten eine einfache HTTP-Antwort `429 Too Many Requests` mit einem Header `Retry-After`
(Sekunden). Die Begrenzungen sind fest vorgegeben; wenn eine legitime Integration sie auslöst,
korrigieren Sie deren Anmeldedaten, statt die Wiederholungsversuche zu intensivieren.

## Schreibvorgänge auf der Control Plane (Sicherungsmechanismus nach der Authentifizierung)

Schreibende Administrator-RPCs (`config.apply`, `config.patch`, `plugins.install`,
`plugins.setEnabled`, `plugins.uninstall`, `update.run`, `worktrees.*`,
`gateway.restart.request`, ...) werden zusätzlich **nach**
der Autorisierung begrenzt: 30 Anfragen pro 60 Sekunden, pro Methode und pro
`deviceId+clientIp`.

Dies ist keine Sicherheitsgrenze — Aufrufer verfügen bereits über `operator.admin` —, sondern
ein Sicherungsmechanismus, der unkontrollierte Client- oder Agentenschleifen begrenzt, die kostspielige
Operationen übermäßig aufrufen. Bei interaktiver Nutzung wird die Begrenzung nie erreicht; jede Methode hat ihren eigenen Bucket, sodass
das Umschalten eines Plugins nicht das Kontingent für Konfigurationsschreibvorgänge verbraucht.

Bei Überschreitung schlägt die Anfrage mit einem wiederholbaren Fehler fehl:

```json
{
  "code": "UNAVAILABLE",
  "message": "rate limit exceeded for config.patch; retry after 35s",
  "retryable": true,
  "retryAfterMs": 34539,
  "details": { "method": "config.patch", "limit": "30 per 60s" }
}
```

Clients sollten `retryAfterMs` beachten. Die Begrenzung ist fest vorgegeben (nicht konfigurierbar);
Buckets laufen selbstständig ab und werden bei der Gateway-Wartung bereinigt.

## ACP-Sitzungserstellung

Der ACP-Übersetzer begrenzt die Sitzungserstellung auf 120 neue Sitzungen pro 10-Sekunden-
Zeitfenster und Übersetzerinstanz. Bei Überschreitung schlägt die Anfrage mit einem Fehler fehl,
dessen Meldung die Wartezeit enthält (auf diesem Pfad gibt es kein strukturiertes Feld `retryAfterMs`):

```
Ratenbegrenzung für die ACP-Sitzungserstellung für <method> überschritten; erneuter Versuch nach <n>s.
```

Dies begrenzt unkontrollierte Clients, die in einer Schleife Sitzungen erstellen; die normale Nutzung durch IDEs und
Agenten bleibt weit darunter.

## Abklingzeit für Neustarts

Gateway-Neustartanfragen werden zusammengeführt und erzwingen anschließend eine Abklingzeit von 30 Sekunden zwischen
Neustartzyklen. Ein während der Abklingzeit angeforderter Neustart wird nach deren
Ablauf eingeplant, statt abgelehnt zu werden. Dies ist von der obigen Control-Plane-Begrenzung
getrennt: `gateway.restart.request` verbraucht einen Control-Plane-Kontingentplatz _und_
der daraus resultierende Neustart unterliegt der Abklingzeit.

## Betriebshinweise

- Alle Begrenzer befinden sich im Arbeitsspeicher und gelten pro Prozess; mehrere Gateways
  teilen keinen Zustand. Das Ersetzen des Gateway-Prozesses löscht die vom Gateway verwalteten
  Zähler (Authentifizierungssperren, Webhook-Drosselung, Control-Plane-Buckets). Die
  Abklingzeit für Neustarts bleibt bewusst über prozessinterne Neustartzyklen hinweg bestehen — genau
  diese drosselt sie — und wird erst mit dem Prozess zurückgesetzt. Die ACP-Sitzungsbegrenzung
  gehört zur jeweiligen Übersetzerinstanz und wird zurückgesetzt, wenn diese Instanz
  neu erstellt wird, nicht bei einem Gateway-Neustart.
- Bucket-Maps sind begrenzt (feste Obergrenzen für Einträge plus regelmäßige Bereinigung), sodass
  Fluten eindeutiger Schlüssel den Speicher nicht unbegrenzt anwachsen lassen können.
- Wenn sich ein Client hinter einem Reverse-Proxy befindet, ist die effektive IP die aufgelöste
  Client-IP; unter [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth) erfahren Sie, wie
  Proxy-Header validiert werden, bevor sie diese beeinflussen können.
- Die Signalisierung für Wiederholungsversuche unterscheidet sich je nach Oberfläche: Gateway-RPC-Begrenzer geben
  `retryable: true` plus `retryAfterMs` zurück, der Webhook-Eingang verwendet HTTP 429
  mit einem Header `Retry-After`, und ACP bettet die Wartezeit in die Fehlermeldung ein.
  Warten Sie in jedem Fall die angegebene Dauer, statt den Versuch
  sofort zu wiederholen.
