---
read_when:
    - Fehlerbehebung bei Fehlern wegen fehlendem Operator-Berechtigungsbereich
    - Genehmigungen für Geräte- oder Node-Kopplungen überprüfen
    - Hinzufügen oder Klassifizieren von Gateway-RPC-Methoden
summary: Operatorrollen, Scopes und Prüfungen zum Genehmigungszeitpunkt für Gateway-Clients
title: Operator-Geltungsbereiche
x-i18n:
    generated_at: "2026-05-04T02:24:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Scopes definieren, was ein Gateway-Client nach der Authentifizierung tun darf.
Sie sind ein Control-Plane-Schutzmechanismus innerhalb einer vertrauenswürdigen Gateway-Operator-Domäne,
keine Isolation gegenüber feindlichen Mandanten in einer Mehrmandantenumgebung. Wenn Sie eine starke Trennung zwischen
Personen, Teams oder Maschinen benötigen, betreiben Sie separate Gateways unter separaten OS-Benutzern oder
Hosts.

Verwandt: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Gateway-WebSocket-Clients verbinden sich mit einer Rolle:

- `operator`: Control-Plane-Clients wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Capability-Hosts wie macOS, iOS, Android oder headless Nodes, die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`. Von Nodes ausgehende Methoden
erfordern die Rolle `node`.

## Scope-Ebenen

| Scope                   | Bedeutung                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Schreibgeschützter Status, Listen, Katalog, Logs, Sitzungslesevorgänge und andere nicht verändernde Control-Plane-Aufrufe.                                                          |
| `operator.write`        | Normale verändernde Operator-Aktionen wie das Senden von Nachrichten, Aufrufen von Tools, Aktualisieren von Talk-/Voice-Einstellungen und Node-Befehlsweiterleitung. Erfüllt auch `operator.read`. |
| `operator.admin`        | Administrativer Control-Plane-Zugriff. Erfüllt jeden `operator.*`-Scope. Erforderlich für Konfigurationsänderungen, Updates, native Hooks, sensible reservierte Namespaces und Genehmigungen mit hohem Risiko. |
| `operator.pairing`      | Geräte- und Node-Kopplungsverwaltung, einschließlich Auflisten, Genehmigen, Ablehnen, Entfernen, Rotieren und Widerrufen von Kopplungsdatensätzen oder Gerätetokens.               |
| `operator.approvals`    | Exec- und Plugin-Genehmigungs-APIs.                                                                                                                                                  |
| `operator.talk.secrets` | Lesen der Talk-Konfiguration einschließlich Geheimnissen.                                                                                                                            |

Unbekannte zukünftige `operator.*`-Scopes erfordern eine exakte Übereinstimmung, sofern der Aufrufer nicht
`operator.admin` besitzt.

## Methoden-Scope ist nur die erste Schranke

Jeder Gateway-RPC hat einen Least-Privilege-Methoden-Scope. Dieser Methoden-Scope entscheidet,
ob die Anfrage den Handler erreichen kann. Einige Handler wenden anschließend strengere
Prüfungen zum Genehmigungszeitpunkt an, basierend auf dem konkreten Objekt, das genehmigt oder verändert wird.

Beispiele:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber das Genehmigen eines
  Operator-Geräts kann nur Scopes ausstellen oder beibehalten, die der Aufrufer bereits besitzt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet anschließend zusätzliche
  Genehmigungs-Scopes aus der ausstehenden Node-Befehlsliste ab.
- `chat.send` ist normalerweise eine Methode mit Schreib-Scope, aber persistente `/config set`
  und `/config unset` erfordern `operator.admin` auf Befehlsebene.

Dadurch können Operatoren mit niedrigerem Scope risikoarme Kopplungsaktionen durchführen, ohne
alle Kopplungsgenehmigungen ausschließlich Admins vorzubehalten.

## Gerätekopplungsgenehmigungen

Gerätekopplungsdatensätze sind die dauerhafte Quelle für genehmigte Rollen und Scopes.
Bereits gekoppelte Geräte erhalten nicht stillschweigend umfassenderen Zugriff: Wiederverbindungen, die
eine umfassendere Rolle oder umfassendere Scopes anfordern, erzeugen eine neue ausstehende Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage:

- Eine Anfrage ohne Operator-Rolle benötigt keine Scope-Genehmigung für Operator-Tokens.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` oder `operator.talk.secrets` erfordert, dass der Aufrufer
  diese Scopes oder `operator.admin` besitzt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Scopes kann die vorhandenen Operator-Token-Scopes
  übernehmen. Wenn dieses vorhandene Token Admin-Scope hat, erfordert die Genehmigung weiterhin
  `operator.admin`.

Für Token-Sitzungen gekoppelter Geräte ist die Verwaltung selbstbezogen, sofern der Aufrufer
nicht zusätzlich `operator.admin` besitzt: Nicht-Admin-Aufrufer sehen nur ihre eigenen Kopplungseinträge,
können nur ihre eigene ausstehende Anfrage genehmigen oder ablehnen und können nur ihren eigenen Geräteeintrag rotieren, widerrufen oder
entfernen.

## Node-Kopplungsgenehmigungen

Das ältere `node.pair.*` verwendet einen separaten, Gateway-eigenen Node-Kopplungsspeicher. WS-Nodes
verwenden Gerätekopplung mit `role: node`, aber dasselbe Vokabular für Genehmigungsebenen
gilt.

`node.pair.approve` verwendet die ausstehende Anfragebefehlsliste, um zusätzliche
erforderliche Scopes abzuleiten:

- Anfrage ohne Befehle: `operator.pairing`
- Nicht-Exec-Node-Befehle: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` oder `system.which`:
  `operator.pairing` + `operator.admin`

Node-Kopplung etabliert Identität und Vertrauen. Sie ersetzt nicht die eigene
`system.run`-Exec-Genehmigungsrichtlinie des Nodes.

## Shared-Secret-Authentifizierung

Authentifizierung per gemeinsamem Gateway-Token/Passwort wird als vertrauenswürdiger Operator-Zugriff für
dieses Gateway behandelt. OpenAI-kompatible HTTP-Oberflächen und `/tools/invoke` stellen den
normalen vollständigen Standard-Scope-Satz für Operatoren bei Shared-Secret-Bearer-Authentifizierung wieder her, selbst wenn ein
Aufrufer engere deklarierte Scopes sendet.

Identitätstragende Modi, wie vertrauenswürdige Proxy-Authentifizierung oder Private-Ingress-`none`,
können weiterhin explizit deklarierte Scopes berücksichtigen. Verwenden Sie separate Gateways für eine echte
Trennung von Vertrauensgrenzen.
