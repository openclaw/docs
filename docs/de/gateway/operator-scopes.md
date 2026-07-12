---
read_when:
    - Fehlerbehebung bei Fehlern aufgrund eines fehlenden Operator-Geltungsbereichs
    - Genehmigungen für Geräte- oder Node-Kopplungen überprüfen
    - Gateway-RPC-Methoden hinzufügen oder klassifizieren
summary: Operatorrollen, Geltungsbereiche und Prüfungen zum Genehmigungszeitpunkt für Gateway-Clients
title: Operator-Berechtigungsbereiche
x-i18n:
    generated_at: "2026-07-12T01:41:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Berechtigungsumfänge schränken ein, was ein Gateway-Client nach der Authentifizierung tun kann.
Sie dienen als Schutzmechanismus der Steuerungsebene innerhalb einer einzelnen vertrauenswürdigen Gateway-Operatordomäne,
nicht als Isolation gegenüber nicht vertrauenswürdigen Mandanten. Für eine starke Trennung zwischen Personen,
Teams oder Maschinen betreiben Sie separate Gateways unter separaten Betriebssystembenutzern oder auf separaten Hosts.

Siehe auch: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Jeder Gateway-WebSocket-Client stellt mit einer Rolle eine Verbindung her:

- `operator`: Clients der Steuerungsebene wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Hosts mit Funktionen (macOS, iOS, Android, ohne grafische Oberfläche), die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`; von Nodes ausgehende Methoden
erfordern die Rolle `node`.

## Berechtigungsstufen

| Berechtigungsumfang     | Bedeutung                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Schreibgeschützter Zugriff auf Status, Listen, Katalog, Protokolle, Sitzungsdaten und andere nicht verändernde Aufrufe.                                                                                   |
| `operator.write`        | Verändernde Operatoraktionen: Nachrichten senden, Werkzeuge aufrufen, Gesprächs-/Spracheinstellungen aktualisieren, Node-Befehle weiterleiten. Erfüllt außerdem `operator.read`.                          |
| `operator.admin`        | Administrativer Zugriff. Erfüllt jeden `operator.*`-Berechtigungsumfang. Erforderlich für Konfigurationsänderungen, Aktualisierungen, native Hooks, reservierte Namensräume und Genehmigungen mit hohem Risiko. |
| `operator.pairing`      | Verwaltung der Geräte- und Node-Kopplung: auflisten, genehmigen, ablehnen, entfernen, rotieren, widerrufen.                                                                                               |
| `operator.approvals`    | Genehmigungs-APIs für Ausführungen und Plugins.                                                                                                                                                           |
| `operator.talk.secrets` | Lesen der Talk-Konfiguration einschließlich geheimer Daten.                                                                                                                                               |

Unbekannte zukünftige `operator.*`-Berechtigungsumfänge erfordern eine exakte Übereinstimmung, sofern der Aufrufer
nicht bereits über `operator.admin` verfügt.

## Der Methodenberechtigungsumfang ist nur die erste Schranke

Jeder Gateway-RPC verfügt über einen Methodenberechtigungsumfang nach dem Prinzip der geringsten Rechte, der entscheidet, ob eine
Anfrage ihren Handler erreicht. Einige Handler wenden anschließend strengere Prüfungen an, die davon abhängen,
was konkret genehmigt oder verändert wird:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber bei der Genehmigung eines
  Operatorgeräts können nur Berechtigungsumfänge ausgestellt oder beibehalten werden, über die der Aufrufer bereits verfügt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet anschließend zusätzliche
  Genehmigungsberechtigungsumfänge aus der deklarierten Befehlsliste der ausstehenden Node ab.
- `chat.send` ist eine Methode mit Schreibberechtigung, aber die Chatbefehle `/config set` und
  `/config unset` erfordern zusätzlich `operator.admin`,
  unabhängig vom Berechtigungsumfang des Aufrufers zum Senden von Chatnachrichten.

Dadurch können Operatoren mit eingeschränkten Berechtigungen Kopplungsaktionen mit geringem Risiko ausführen,
ohne dass sämtliche Kopplungsgenehmigungen ausschließlich Administratoren vorbehalten sind.

## Genehmigungen für die Gerätekopplung

Datensätze zur Gerätekopplung sind die dauerhafte Quelle für genehmigte Rollen und Berechtigungsumfänge.
Ein bereits gekoppeltes Gerät erhält nicht unbemerkt umfassenderen Zugriff: Eine erneute Verbindung,
die eine umfassendere Rolle oder umfassendere Berechtigungsumfänge anfordert, erzeugt eine neue ausstehende
Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage gilt:

- Eine Anfrage ohne Operatorrolle benötigt keine Genehmigung des Operator-Berechtigungsumfangs.
- Eine Anfrage für eine Geräterolle, die keine Operatorrolle ist (beispielsweise `node`), erfordert
  `operator.admin`, obwohl `device.pair.approve` selbst nur
  `operator.pairing` benötigt.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` oder `operator.talk.secrets` setzt voraus, dass der Aufrufer bereits
  über diesen Berechtigungsumfang oder `operator.admin` verfügt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Berechtigungsumfänge kann die Berechtigungsumfänge des vorhandenen
  Operator-Tokens übernehmen; verfügt dieses Token über Administratorberechtigungen, erfordert die Genehmigung dennoch
  `operator.admin`.

Sitzungen ohne Administratorberechtigung, die ein gemeinsames Geheimnis oder einen vertrauenswürdigen Proxy verwenden, können
Anfragen für Operatorgeräte nur innerhalb ihrer eigenen deklarierten Operator-Berechtigungsumfänge genehmigen; die Genehmigung
von Rollen, die keine Operatorrollen sind, ist ausschließlich Administratoren vorbehalten, selbst wenn diese Sitzungen ansonsten
`operator.pairing` verwenden dürfen.

Bei Sitzungen mit Tokens gekoppelter Geräte ist die Verwaltung auf das eigene Gerät beschränkt, sofern der Aufrufer
nicht über `operator.admin` verfügt: Ein Aufrufer ohne Administratorberechtigung sieht nur seine eigenen Kopplungseinträge und
kann nur den Eintrag seines eigenen Geräts genehmigen, ablehnen, rotieren, widerrufen oder entfernen.

## Genehmigungen für die Node-Kopplung

Ältere `node.pair.*`-Methoden verwenden einen separaten, vom Gateway verwalteten Speicher für Node-Kopplungen.
WS-Nodes verwenden stattdessen die Gerätekopplung (`role: node`), es gilt jedoch dasselbe
Genehmigungsvokabular. Unter [Gateway-Kopplung](/de/gateway/pairing) erfahren Sie, wie die beiden
Speicher zusammenhängen.

`node.pair.approve` leitet zusätzliche erforderliche Berechtigungsumfänge aus der Befehlsliste
der ausstehenden Anfrage ab:

| Deklarierte Befehle                                    | Erforderliche Berechtigungsumfänge       |
| ------------------------------------------------------ | ---------------------------------------- |
| keine                                                  | `operator.pairing`                       |
| Node-Befehle ohne Ausführung                           | `operator.pairing` + `operator.write`    |
| `system.run`, `system.run.prepare` oder `system.which` | `operator.pairing` + `operator.admin`    |

Durch die Genehmigung einer Node-Deklaration werden keine Befehle aktiviert, die einer separaten
Zulassungslistenprüfung zur Laufzeit unterliegen. Beispielsweise erfordert die Genehmigung einer Node, die
`computer.act` deklariert, sowohl den Kopplungs- als auch den Schreibberechtigungsumfang, erfasst jedoch nur die verfügbare Schnittstelle.
Ein Administrator oder Eigentümer muss `computer.act` weiterhin aktivieren. Solange es
aktiviert bleibt, ist für seinen Aufruf über die schreibberechtigte Methode `node.invoke` nicht
für jede Aktion der Administratorberechtigungsumfang erforderlich.

Die Node-Kopplung stellt Identität und Vertrauen her; sie ersetzt nicht die eigene
Genehmigungsrichtlinie einer Node für `system.run`-Ausführungen.

## Authentifizierung mit gemeinsamem Geheimnis

Die Authentifizierung über ein gemeinsames Gateway-Token/-Passwort wird als vertrauenswürdiger Operatorzugriff für
dieses Gateway behandelt. OpenAI-kompatible HTTP-Schnittstellen, `/tools/invoke` und HTTP-Endpunkte
für den Sitzungsverlauf stellen bei Bearer-Authentifizierung mit gemeinsamem Geheimnis den vollständigen standardmäßigen Satz von Operator-Berechtigungsumfängen wieder her, selbst wenn ein Aufrufer eingeschränktere Berechtigungsumfänge deklariert.

Identitätstragende Modi wie die Authentifizierung über einen vertrauenswürdigen Proxy oder `none` für privaten Eingangsdatenverkehr
können weiterhin explizit deklarierte Berechtigungsumfänge berücksichtigen. Verwenden Sie separate Gateways für eine echte
Trennung von Vertrauensgrenzen.
