---
read_when:
    - Fehlerbehebung bei fehlenden Operator-Berechtigungsbereichen
    - Genehmigungen für die Kopplung von Geräten oder Nodes überprüfen
    - Gateway-RPC-Methoden hinzufügen oder klassifizieren
summary: Operatorrollen, Berechtigungsbereiche und Prüfungen zum Genehmigungszeitpunkt für Gateway-Clients
title: Operator-Berechtigungsbereiche
x-i18n:
    generated_at: "2026-07-12T15:26:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Berechtigungsbereiche steuern, was ein Gateway-Client nach der Authentifizierung tun kann.
Sie dienen als Schutzmechanismus der Steuerungsebene innerhalb einer einzelnen vertrauenswürdigen Gateway-Operatordomäne,
nicht als Isolation gegenüber böswilligen Mandanten. Für eine starke Trennung zwischen Personen,
Teams oder Maschinen führen Sie separate Gateways unter separaten Betriebssystembenutzern oder auf separaten Hosts aus.

Siehe auch: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Jeder Gateway-WebSocket-Client stellt die Verbindung mit einer Rolle her:

- `operator`: Clients der Steuerungsebene wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Funktions-Hosts (macOS, iOS, Android, ohne Benutzeroberfläche), die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`; von Nodes stammende Methoden
erfordern die Rolle `node`.

## Berechtigungsstufen

| Berechtigungsbereich   | Bedeutung                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Schreibgeschützter Zugriff auf Status, Listen, Katalog, Protokolle und Sitzungen sowie andere nicht verändernde Aufrufe.                                                                                  |
| `operator.write`        | Verändernde Operatoraktionen: Nachrichten senden, Tools aufrufen, Sprech-/Spracheinstellungen aktualisieren und Node-Befehle weiterleiten. Erfüllt auch `operator.read`.                                  |
| `operator.admin`        | Administrativer Zugriff. Erfüllt jeden `operator.*`-Berechtigungsbereich. Erforderlich für Konfigurationsänderungen, Updates, native Hooks, reservierte Namensräume und Genehmigungen mit hohem Risiko. |
| `operator.pairing`      | Verwaltung der Geräte- und Node-Kopplung: auflisten, genehmigen, ablehnen, entfernen, rotieren und widerrufen.                                                                                           |
| `operator.approvals`    | Genehmigungs-APIs für Ausführungen und Plugins.                                                                                                                                                           |
| `operator.talk.secrets` | Lesen der Sprechkonfiguration einschließlich Geheimnissen.                                                                                                                                                |

Unbekannte zukünftige `operator.*`-Berechtigungsbereiche erfordern eine exakte Übereinstimmung, sofern der Aufrufer
nicht bereits über `operator.admin` verfügt.

## Der Methoden-Berechtigungsbereich ist nur die erste Schranke

Jeder Gateway-RPC verfügt über einen Methoden-Berechtigungsbereich nach dem Prinzip der geringsten Rechte, der entscheidet, ob eine
Anfrage ihren Handler erreicht. Einige Handler wenden anschließend strengere Prüfungen an, abhängig von
dem konkreten Element, das genehmigt oder verändert wird:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber bei der Genehmigung eines
  Operatorgeräts können nur Berechtigungsbereiche ausgestellt oder beibehalten werden, über die der Aufrufer bereits verfügt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet anschließend zusätzliche
  Genehmigungs-Berechtigungsbereiche aus der deklarierten Befehlsliste des ausstehenden Nodes ab.
- `chat.send` ist eine Methode mit Schreibberechtigung, aber die Chatbefehle `/config set` und
  `/config unset` erfordern zusätzlich `operator.admin`,
  unabhängig vom Berechtigungsbereich des Aufrufers zum Senden von Chatnachrichten.

Dadurch können Operatoren mit eingeschränkten Berechtigungen Kopplungsaktionen mit geringem Risiko ausführen,
ohne dass alle Kopplungsgenehmigungen ausschließlich Administratoren vorbehalten sind.

## Genehmigungen für die Gerätekopplung

Datensätze zur Gerätekopplung sind die dauerhafte Quelle für genehmigte Rollen und Berechtigungsbereiche.
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff: Eine erneute Verbindung,
die eine umfassendere Rolle oder umfassendere Berechtigungsbereiche anfordert, erstellt eine neue ausstehende Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage gilt:

- Eine Anfrage ohne Operatorrolle benötigt keine Genehmigung für Operator-Berechtigungsbereiche.
- Eine Anfrage für eine Gerätefunktion ohne Operatorrolle (beispielsweise `node`) erfordert
  `operator.admin`, obwohl `device.pair.approve` selbst nur
  `operator.pairing` benötigt.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` oder `operator.talk.secrets` setzt voraus, dass der Aufrufer bereits
  über diesen Berechtigungsbereich oder über `operator.admin` verfügt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Berechtigungsbereiche kann die Berechtigungsbereiche des vorhandenen Operator-
  Tokens übernehmen; wenn dieses Token über Administratorberechtigungen verfügt, erfordert die Genehmigung dennoch
  `operator.admin`.

Sitzungen ohne Administratorberechtigung, die ein gemeinsames Geheimnis oder einen vertrauenswürdigen Proxy verwenden, können
Anfragen von Operatorgeräten nur innerhalb ihrer eigenen deklarierten Operator-Berechtigungsbereiche genehmigen; die Genehmigung
von Rollen ohne Operatorfunktion ist ausschließlich Administratoren vorbehalten, selbst wenn diese Sitzungen anderweitig
`operator.pairing` verwenden können.

Bei Sitzungen mit Tokens gekoppelter Geräte ist die Verwaltung auf das eigene Gerät beschränkt, sofern der Aufrufer nicht
über `operator.admin` verfügt: Ein Aufrufer ohne Administratorberechtigung sieht nur seine eigenen Kopplungseinträge und
kann ausschließlich seinen eigenen Geräteeintrag genehmigen, ablehnen, rotieren, widerrufen oder entfernen.

## Genehmigungen für die Node-Kopplung

Ältere `node.pair.*`-Methoden verwenden einen separaten, vom Gateway verwalteten Node-Kopplungsspeicher.
WS-Nodes verwenden stattdessen die Gerätekopplung (`role: node`), es gilt jedoch dieselbe
Genehmigungsterminologie. Unter [Gateway-Kopplung](/de/gateway/pairing) erfahren Sie, wie die beiden
Speicher zusammenhängen.

`node.pair.approve` leitet zusätzliche erforderliche Berechtigungsbereiche aus der
Befehlsliste der ausstehenden Anfrage ab:

| Deklarierte Befehle                                    | Erforderliche Berechtigungsbereiche        |
| ------------------------------------------------------ | ------------------------------------------ |
| keine                                                  | `operator.pairing`                         |
| Node-Befehle ohne Ausführung                           | `operator.pairing` + `operator.write`      |
| `system.run`, `system.run.prepare` oder `system.which` | `operator.pairing` + `operator.admin`      |

Durch die Genehmigung einer Node-Deklaration werden keine Befehle aktiviert, für die eine separate
Laufzeit-Zulassungsliste gilt. Beispielsweise erfordert die Genehmigung eines Nodes, der
`computer.act` deklariert, Kopplungs- und Schreibberechtigungen, zeichnet jedoch nur die Schnittstelle auf.
Ein Administrator oder Eigentümer muss `computer.act` weiterhin aktivieren. Solange es
aktiviert bleibt, ist für den Aufruf über die schreibberechtigte Methode `node.invoke` nicht
bei jeder Aktion eine Administratorberechtigung erforderlich.

Die Node-Kopplung stellt Identität und Vertrauen her; sie ersetzt nicht die eigene
Genehmigungsrichtlinie eines Nodes für die Ausführung von `system.run`.

## Authentifizierung mit gemeinsamem Geheimnis

Die Authentifizierung mit einem gemeinsamen Gateway-Token/-Passwort wird für dieses Gateway als vertrauenswürdiger Operatorzugriff behandelt.
OpenAI-kompatible HTTP-Schnittstellen, `/tools/invoke` und HTTP-Endpunkte für den
Sitzungsverlauf stellen bei Bearer-Authentifizierung mit gemeinsamem Geheimnis den vollständigen Standardsatz der Operator-Berechtigungsbereiche wieder her,
selbst wenn ein Aufrufer eingeschränktere deklarierte Berechtigungsbereiche sendet.

Identitätstragende Modi wie die Authentifizierung über einen vertrauenswürdigen Proxy oder `none` bei privatem Eingang
können weiterhin explizit deklarierte Berechtigungsbereiche berücksichtigen. Verwenden Sie separate Gateways für eine echte
Trennung von Vertrauensgrenzen.
