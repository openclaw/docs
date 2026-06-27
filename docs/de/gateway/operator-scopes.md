---
read_when:
    - Fehler bei fehlendem Operator-Scope debuggen
    - Genehmigungen für Geräte- oder Node-Kopplungen überprüfen
    - Gateway-RPC-Methoden hinzufügen oder klassifizieren
summary: Operatorrollen, Geltungsbereiche und Prüfungen zum Genehmigungszeitpunkt für Gateway-Clients
title: Operator-Scopes
x-i18n:
    generated_at: "2026-06-27T17:32:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Scopes definieren, was ein Gateway-Client nach der Authentifizierung tun darf.
Sie sind eine Control-Plane-Leitplanke innerhalb einer vertrauenswürdigen Gateway-Operator-Domäne,
keine Isolation gegenüber feindlichen Mandanten. Wenn Sie eine starke Trennung zwischen
Personen, Teams oder Maschinen benötigen, betreiben Sie separate Gateways unter separaten Betriebssystembenutzern oder
Hosts.

Verwandt: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Gateway-WebSocket-Clients verbinden sich mit einer Rolle:

- `operator`: Control-Plane-Clients wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Capability-Hosts wie macOS, iOS, Android oder Headless-Nodes, die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`. Von Nodes initiierte Methoden
erfordern die Rolle `node`.

## Scope-Stufen

| Scope                   | Bedeutung                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Schreibgeschützter Status, Listen, Katalog, Protokolle, Sitzungslesezugriffe und andere nicht mutierende Control-Plane-Aufrufe.                                                                  |
| `operator.write`        | Normale mutierende Operator-Aktionen wie das Senden von Nachrichten, das Aufrufen von Tools, das Aktualisieren von Talk-/Spracheinstellungen und die Weiterleitung von Node-Befehlen. Erfüllt auch `operator.read`. |
| `operator.admin`        | Administrativer Control-Plane-Zugriff. Erfüllt jeden `operator.*`-Scope. Erforderlich für Konfigurationsänderungen, Updates, native Hooks, sensible reservierte Namespaces und risikoreiche Genehmigungen. |
| `operator.pairing`      | Verwaltung der Geräte- und Node-Kopplung, einschließlich Auflisten, Genehmigen, Ablehnen, Entfernen, Rotieren und Widerrufen von Kopplungsdatensätzen oder Geräte-Tokens.                         |
| `operator.approvals`    | Exec- und Plugin-Genehmigungs-APIs.                                                                                                                                                               |
| `operator.talk.secrets` | Lesen der Talk-Konfiguration mit eingeschlossenen Secrets.                                                                                                                                         |

Unbekannte zukünftige `operator.*`-Scopes erfordern eine exakte Übereinstimmung, sofern der Aufrufer nicht
`operator.admin` besitzt.

## Methoden-Scope ist nur die erste Schranke

Jeder Gateway-RPC hat einen Methoden-Scope mit minimalen Rechten. Dieser Methoden-Scope entscheidet,
ob die Anfrage den Handler erreichen kann. Einige Handler wenden danach strengere
Prüfungen zum Genehmigungszeitpunkt an, basierend auf dem konkreten Objekt, das genehmigt oder geändert wird.

Beispiele:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber das Genehmigen eines
  Operator-Geräts kann nur Scopes ausstellen oder erhalten, die der Aufrufer bereits besitzt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet dann zusätzliche
  Genehmigungs-Scopes aus der ausstehenden Node-Befehlsliste ab.
- `chat.send` ist normalerweise eine Methode mit Schreib-Scope, aber persistente `/config set`
  und `/config unset` erfordern `operator.admin` auf Befehlsebene.

Dadurch können Operatoren mit geringerem Scope risikoarme Kopplungsaktionen ausführen, ohne
alle Kopplungsgenehmigungen nur Administratoren vorzubehalten.

## Genehmigungen für Gerätekopplung

Gerätekopplungsdatensätze sind die dauerhafte Quelle genehmigter Rollen und Scopes.
Bereits gekoppelte Geräte erhalten nicht stillschweigend breiteren Zugriff: Wiederverbindungen, die
eine breitere Rolle oder breitere Scopes anfordern, erzeugen eine neue ausstehende Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage:

- Eine Anfrage ohne Operator-Rolle benötigt keine Genehmigung des Operator-Token-Scopes.
- Eine Anfrage für eine Nicht-Operator-Geräterolle, wie `node`, erfordert
  `operator.admin`, selbst wenn `device.pair.approve` mit
  `operator.pairing` erreichbar ist.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` oder `operator.talk.secrets` erfordert, dass der Aufrufer
  diese Scopes oder `operator.admin` besitzt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Scopes kann die bestehenden Operator-Token-Scopes
  übernehmen. Wenn dieses bestehende Token einen Admin-Scope hat, erfordert die Genehmigung weiterhin
  `operator.admin`.

Nicht-administrative Shared-Secret- und Trusted-Proxy-Sitzungen können Operator-Geräteanfragen
nur innerhalb ihrer eigenen deklarierten Operator-Scopes genehmigen. Das Genehmigen von Nicht-Operator-
Rollen ist nur Administratoren vorbehalten, selbst wenn diese Sitzungen sonst
`operator.pairing` verwenden können.

Bei Sitzungen mit Tokens gekoppelter Geräte ist die Verwaltung ebenfalls auf den eigenen Scope beschränkt, sofern der
Aufrufer nicht `operator.admin` besitzt: Nicht-administrative Aufrufer sehen nur ihre eigenen Kopplungs-
Einträge, können nur ihre eigene ausstehende Anfrage genehmigen oder ablehnen und können nur ihren eigenen Geräteeintrag
rotieren, widerrufen oder entfernen.

## Genehmigungen für Node-Kopplung

Das Legacy-`node.pair.*` verwendet einen separaten Gateway-eigenen Node-Kopplungsspeicher. WS-Nodes
verwenden Gerätekopplung mit `role: node`, aber dasselbe Vokabular für Genehmigungsstufen
gilt.

`node.pair.approve` verwendet die Befehlsliste der ausstehenden Anfrage, um zusätzliche
erforderliche Scopes abzuleiten:

- Anfrage ohne Befehle: `operator.pairing`
- Nicht-Exec-Node-Befehle: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` oder `system.which`:
  `operator.pairing` + `operator.admin`

Node-Kopplung etabliert Identität und Vertrauen. Sie ersetzt nicht die eigene
`system.run`-Exec-Genehmigungsrichtlinie des Nodes.

## Shared-Secret-Authentifizierung

Die Authentifizierung über gemeinsames Gateway-Token/Passwort wird als vertrauenswürdiger Operator-Zugriff für
dieses Gateway behandelt. OpenAI-kompatible HTTP-Oberflächen, `/tools/invoke` und HTTP-Endpunkte für den Sitzungsverlauf
stellen für Shared-Secret-Bearer-Authentifizierung wieder den normalen vollständigen Standard-Operator-Scope-Satz her,
selbst wenn ein Aufrufer engere deklarierte Scopes sendet.

Identitätstragende Modi, wie Trusted-Proxy-Authentifizierung oder Private-Ingress-`none`,
können explizit deklarierte Scopes weiterhin berücksichtigen. Verwenden Sie separate Gateways für echte
Trennung von Vertrauensgrenzen.
