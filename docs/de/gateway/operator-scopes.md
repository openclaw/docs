---
read_when:
    - Fehler wegen fehlendem Operator-Berechtigungsumfang debuggen
    - Kopplungsgenehmigungen für Geräte oder Nodes prüfen
    - Gateway-RPC-Methoden hinzufügen oder klassifizieren
summary: Operatorrollen, Berechtigungsbereiche und Prüfungen bei der Genehmigung für Gateway-Clients
title: Operator-Geltungsbereiche
x-i18n:
    generated_at: "2026-05-03T06:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Scopes definieren, was ein Gateway-Client nach der Authentifizierung tun darf.
Sie sind eine Control-Plane-Leitplanke innerhalb einer vertrauenswürdigen Gateway-Operator-Domain,
keine feindselige Multi-Tenant-Isolation. Wenn Sie eine starke Trennung zwischen
Personen, Teams oder Maschinen benötigen, betreiben Sie separate Gateways unter separaten OS-Benutzern oder
Hosts.

Verwandt: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Gateway-WebSocket-Clients verbinden sich mit einer Rolle:

- `operator`: Control-Plane-Clients wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Capability-Hosts wie macOS, iOS, Android oder Headless-Nodes, die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`. Von Nodes ausgehende Methoden
erfordern die Rolle `node`.

## Scope-Ebenen

| Scope                   | Bedeutung                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Schreibgeschützter Status, Listen, Katalog, Logs, Sitzungslesevorgänge und andere nicht mutierende Control-Plane-Aufrufe.                                                             |
| `operator.write`        | Normale mutierende Operator-Aktionen wie das Senden von Nachrichten, Aufrufen von Tools, Aktualisieren von Talk-/Voice-Einstellungen und Node-Befehlsweiterleitung. Erfüllt auch `operator.read`. |
| `operator.admin`        | Administrativer Control-Plane-Zugriff. Erfüllt jeden `operator.*`-Scope. Erforderlich für Konfigurationsänderungen, Updates, native Hooks, sensible reservierte Namespaces und risikoreiche Genehmigungen. |
| `operator.pairing`      | Verwaltung der Geräte- und Node-Kopplung, einschließlich Auflisten, Genehmigen, Ablehnen, Entfernen, Rotieren und Widerrufen von Kopplungsdatensätzen oder Gerätetokens.              |
| `operator.approvals`    | Exec- und Plugin-Genehmigungs-APIs.                                                                                                                                                    |
| `operator.talk.secrets` | Lesen der Talk-Konfiguration einschließlich Secrets.                                                                                                                                    |

Unbekannte zukünftige `operator.*`-Scopes erfordern eine exakte Übereinstimmung, sofern der Aufrufer nicht
`operator.admin` besitzt.

## Methoden-Scope ist nur die erste Schranke

Jeder Gateway-RPC hat einen Least-Privilege-Methoden-Scope. Dieser Methoden-Scope entscheidet,
ob die Anfrage den Handler erreichen kann. Einige Handler wenden anschließend strengere
Prüfungen zum Genehmigungszeitpunkt an, basierend auf der konkreten Sache, die genehmigt oder geändert wird.

Beispiele:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber das Genehmigen eines
  Operator-Geräts kann nur Scopes ausstellen oder beibehalten, die der Aufrufer bereits besitzt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet anschließend zusätzliche
  Genehmigungs-Scopes aus der ausstehenden Node-Befehlsliste ab.
- `chat.send` ist normalerweise eine Methode mit Write-Scope, aber persistente `/config set`
  und `/config unset` erfordern `operator.admin` auf Befehlsebene.

So können Operatoren mit geringerem Scope Kopplungsaktionen mit geringem Risiko ausführen, ohne
alle Kopplungsgenehmigungen admin-only zu machen.

## Genehmigungen für Gerätekopplung

Gerätekopplungsdatensätze sind die dauerhafte Quelle genehmigter Rollen und Scopes.
Bereits gekoppelte Geräte erhalten nicht stillschweigend breiteren Zugriff: Neuverbindungen, die
eine breitere Rolle oder breitere Scopes anfordern, erstellen eine neue ausstehende Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage:

- Eine Anfrage ohne Operator-Rolle benötigt keine Operator-Token-Scope-Genehmigung.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` oder `operator.talk.secrets` erfordert, dass der Aufrufer
  diese Scopes oder `operator.admin` besitzt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Scopes kann die vorhandenen Operator-
  Token-Scopes übernehmen. Wenn dieses vorhandene Token admin-scoped ist, erfordert
  die Genehmigung weiterhin `operator.admin`.

Für Token-Sitzungen gekoppelter Geräte ist die Verwaltung selbstbezogen, sofern der Aufrufer
nicht zusätzlich `operator.admin` besitzt: Nicht-Admin-Aufrufer können nur
ihren eigenen Geräteeintrag rotieren, widerrufen oder entfernen.

## Genehmigungen für Node-Kopplung

Das ältere `node.pair.*` verwendet einen separaten Gateway-eigenen Node-Kopplungsspeicher. WS-Nodes
verwenden Gerätekopplung mit `role: node`, aber dasselbe Vokabular auf Genehmigungsebene
gilt.

`node.pair.approve` verwendet die Befehlsliste der ausstehenden Anfrage, um zusätzliche
erforderliche Scopes abzuleiten:

- Anfrage ohne Befehle: `operator.pairing`
- Nicht-Exec-Node-Befehle: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` oder `system.which`:
  `operator.pairing` + `operator.admin`

Node-Kopplung stellt Identität und Vertrauen her. Sie ersetzt nicht die eigene
`system.run`-Exec-Genehmigungsrichtlinie des Nodes.

## Shared-Secret-Authentifizierung

Geteilte Gateway-Token-/Passwort-Authentifizierung wird als vertrauenswürdiger Operator-Zugriff für
dieses Gateway behandelt. OpenAI-kompatible HTTP-Oberflächen und `/tools/invoke` stellen den
normalen vollständigen Standard-Operator-Scope-Satz für Shared-Secret-Bearer-Authentifizierung wieder her, selbst wenn ein
Aufrufer engere deklarierte Scopes sendet.

Identitätstragende Modi wie vertrauenswürdige Proxy-Authentifizierung oder Private-Ingress `none`
können explizit deklarierte Scopes weiterhin berücksichtigen. Verwenden Sie separate Gateways für echte
Trennung von Vertrauensgrenzen.
