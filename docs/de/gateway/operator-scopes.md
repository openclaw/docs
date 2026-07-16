---
read_when:
    - Fehlerbehebung bei Fehlern aufgrund eines fehlenden Operator-Bereichs
    - Überprüfen von Genehmigungen für die Geräte- oder Node-Kopplung
    - Gateway-RPC-Methoden hinzufügen oder klassifizieren
summary: Operatorrollen, Geltungsbereiche und Prüfungen zum Genehmigungszeitpunkt für Gateway-Clients
title: Operatorbereiche
x-i18n:
    generated_at: "2026-07-16T12:48:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Berechtigungsbereiche steuern, was ein Gateway-Client nach der Authentifizierung tun kann.
Sie bilden eine Schutzvorkehrung der Steuerungsebene innerhalb einer einzelnen vertrauenswürdigen Gateway-Operatordomäne,
keine Isolation gegenüber feindlichen Mandanten. Für eine starke Trennung zwischen Personen,
Teams oder Maschinen müssen separate Gateways unter separaten Betriebssystembenutzern oder auf separaten Hosts ausgeführt werden.

Verwandte Themen: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Jeder Gateway-WebSocket-Client stellt mit einer Rolle eine Verbindung her:

- `operator`: Steuerungsebenen-Clients wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Funktions-Hosts (macOS, iOS, Android, headless), die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`; von Nodes ausgehende Methoden
erfordern die Rolle `node`.

## Berechtigungsbereichsebenen

| Berechtigungsbereich     | Bedeutung                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Schreibgeschützter Status, Listen, Katalog, Protokolle, Sitzungslesevorgänge und andere nicht verändernde Aufrufe.                                             |
| `operator.write`        | Verändernde Operator-Aktionen: Nachrichten senden, Tools aufrufen, Gesprächs-/Spracheinstellungen aktualisieren, Node-Befehle weiterleiten. Erfüllt auch `operator.read`. |
| `operator.admin`        | Administrativer Zugriff. Erfüllt jeden `operator.*`-Berechtigungsbereich. Erforderlich für Konfigurationsänderungen, Updates, native Hooks, reservierte Namensräume und risikoreiche Genehmigungen. |
| `operator.pairing`      | Verwaltung der Geräte- und Node-Kopplung: auflisten, genehmigen, ablehnen, entfernen, rotieren, widerrufen.                                                    |
| `operator.approvals`    | Genehmigungs-APIs für Ausführung und Plugins.                                                                                                                  |
| `operator.talk.secrets` | Lesen der Gesprächskonfiguration einschließlich Geheimnissen.                                                                                                  |

Unbekannte zukünftige `operator.*`-Berechtigungsbereiche erfordern eine exakte Übereinstimmung, sofern der Aufrufer
nicht bereits über `operator.admin` verfügt.

## Der Methoden-Berechtigungsbereich ist nur die erste Schranke

Jeder Gateway-RPC verfügt über einen Methoden-Berechtigungsbereich nach dem Prinzip der geringsten Rechte, der entscheidet, ob eine
Anfrage ihren Handler erreicht. Einige Handler wenden anschließend strengere Prüfungen an, die von
dem konkreten Element abhängen, das genehmigt oder verändert wird:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber bei der Genehmigung eines
  Operator-Geräts können nur Berechtigungsbereiche erstellt oder beibehalten werden, über die der Aufrufer bereits verfügt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet anschließend zusätzliche
  Genehmigungs-Berechtigungsbereiche aus der deklarierten Befehlsliste des ausstehenden Nodes ab.
- `chat.send` ist eine Methode mit Schreibberechtigung, aber die Chatbefehle `/config set` und
  `/config unset` erfordern zusätzlich `operator.admin`,
  unabhängig vom Berechtigungsbereich des Aufrufers zum Senden von Chatnachrichten.

Dadurch können Operatoren mit geringeren Berechtigungsbereichen Kopplungsaktionen mit geringem Risiko ausführen, ohne
dass für alle Kopplungsgenehmigungen ausschließlich Administratorzugriff erforderlich ist.

## Genehmigungen für die Gerätekopplung

Gerätekopplungsdatensätze sind die dauerhafte Quelle genehmigter Rollen und Berechtigungsbereiche.
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff: Eine erneute Verbindung,
die eine umfassendere Rolle oder umfassendere Berechtigungsbereiche anfordert, erstellt eine neue ausstehende
Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage gilt:

- Eine Anfrage ohne Operator-Rolle benötigt keine Genehmigung des Operator-Berechtigungsbereichs.
- Eine Anfrage für eine Geräte-Rolle ohne Operatorfunktion (beispielsweise `node`) erfordert
  `operator.admin`, obwohl `device.pair.approve` selbst nur
  `operator.pairing` benötigt.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` oder `operator.talk.secrets` erfordert, dass der Aufrufer bereits
  über diesen Berechtigungsbereich oder `operator.admin` verfügt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Berechtigungsbereiche kann die Berechtigungsbereiche des vorhandenen Operator-
  Tokens übernehmen; wenn dieses Token über Administratorberechtigungen verfügt, erfordert die Genehmigung dennoch
  `operator.admin`.

Sitzungen mit einem gemeinsamen Geheimnis ohne Administratorberechtigungen und vertrauenswürdige Proxy-Sitzungen können
Anfragen von Operator-Geräten nur innerhalb ihrer eigenen deklarierten Operator-Berechtigungsbereiche genehmigen; die Genehmigung
von Rollen ohne Operatorfunktion ist ausschließlich Administratoren vorbehalten, selbst wenn diese Sitzungen ansonsten
`operator.pairing` verwenden können.

Bei Sitzungen mit Tokens gekoppelter Geräte ist die Verwaltung auf das eigene Gerät beschränkt, sofern der Aufrufer
nicht über `operator.admin` verfügt: Ein Aufrufer ohne Administratorberechtigungen sieht nur seine eigenen Kopplungseinträge und
kann nur seinen eigenen Geräteeintrag genehmigen, ablehnen, rotieren, widerrufen oder entfernen.

## Genehmigungen für die Node-Kopplung

Ältere `node.pair.*`-Methoden verwenden einen separaten, vom Gateway verwalteten Speicher für Node-Kopplungen.
WS-Nodes verwenden stattdessen die Gerätekopplung (`role: node`), es gilt jedoch dasselbe
Genehmigungsvokabular. Unter [Gateway-Kopplung](/de/gateway/pairing) wird erläutert, wie die beiden
Speicher zusammenhängen.

`node.pair.approve` leitet zusätzliche erforderliche Berechtigungsbereiche aus der Befehlsliste
der ausstehenden Anfrage ab:

| Deklarierte Befehle                                                                                                  | Erforderliche Berechtigungsbereiche    |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| keine                                                                                                                | `operator.pairing`                    |
| gewöhnliche Node-Befehle                                                                                             | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` oder `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Durch die Genehmigung einer Node-Deklaration werden keine Befehle aktiviert, die über eine separate
Zulassungsliste zur Laufzeit gesteuert werden. Beispielsweise erfordert die Genehmigung eines Nodes, der
`computer.act` deklariert, eine Kopplungs- sowie Schreibberechtigung, zeichnet jedoch nur die Schnittstelle auf.
Ein Administrator oder Eigentümer muss `computer.act` weiterhin aktivieren. Solange es
aktiviert bleibt, ist für seinen Aufruf über die Methode `node.invoke` mit Schreibberechtigung nicht
für jede Aktion ein Administrator-Berechtigungsbereich erforderlich.

Die Node-Kopplung stellt Identität und Vertrauen her; sie ersetzt nicht die eigene
`system.run`-Ausführungsgenehmigungsrichtlinie eines Nodes.

## Authentifizierung mit gemeinsamem Geheimnis

Die Authentifizierung mit einem gemeinsamen Gateway-Token/-Passwort wird für dieses
Gateway als vertrauenswürdiger Operatorzugriff behandelt. OpenAI-kompatible HTTP-Schnittstellen, `/tools/invoke` und HTTP-
Endpunkte für den Sitzungsverlauf stellen bei der Bearer-Authentifizierung mit gemeinsamem Geheimnis den vollständigen standardmäßigen Operator-Berechtigungsbereichssatz wieder her,
selbst wenn ein Aufrufer engere deklarierte Berechtigungsbereiche übermittelt.

Identitätstragende Modi wie die Authentifizierung über einen vertrauenswürdigen Proxy oder `none` für privaten Ingress
können explizit deklarierte Berechtigungsbereiche weiterhin berücksichtigen. Verwenden Sie separate Gateways für eine echte Trennung
von Vertrauensgrenzen.
