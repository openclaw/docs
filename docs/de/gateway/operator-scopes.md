---
read_when:
    - Fehlerbehebung bei Fehlern aufgrund eines fehlenden Operator-Bereichs
    - Überprüfen von Genehmigungen für die Geräte- oder Node-Kopplung
    - Gateway-RPC-Methoden hinzufügen oder klassifizieren
summary: Operatorrollen, Geltungsbereiche und Prüfungen zum Genehmigungszeitpunkt für Gateway-Clients
title: Operatorbereiche
x-i18n:
    generated_at: "2026-07-24T03:51:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40053793bb5a80afab28fdfcdcac6565abde6bca988389b03a407272c70043e2
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator-Bereiche begrenzen, was ein Gateway-Client nach erfolgreicher Authentifizierung tun kann.
Sie dienen als Schutzmechanismus der Steuerungsebene innerhalb einer einzelnen vertrauenswürdigen Gateway-Operatordomäne,
nicht als feindresistente Mandantentrennung. Für eine starke Trennung zwischen Personen,
Teams oder Maschinen müssen separate Gateways unter separaten Betriebssystembenutzern oder auf separaten Hosts ausgeführt werden.

Verwandte Themen: [Sicherheit](/de/gateway/security), [Gateway-Protokoll](/de/gateway/protocol),
[Gateway-Kopplung](/de/gateway/pairing), [Geräte-CLI](/de/cli/devices).

## Rollen

Jeder Gateway-WebSocket-Client stellt eine Verbindung mit einer Rolle her:

- `operator`: Clients der Steuerungsebene wie CLI, Control UI, Automatisierung und
  vertrauenswürdige Hilfsprozesse.
- `node`: Hosts für Funktionen (macOS, iOS, Android, headless), die
  Befehle über `node.invoke` bereitstellen.

Operator-RPC-Methoden erfordern die Rolle `operator`; von Nodes ausgehende Methoden
erfordern die Rolle `node`.

## Bereichsebenen

| Bereich                 | Bedeutung                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Schreibgeschützter Status, Listen, Katalog, Protokolle, Sitzungslesezugriffe und andere nicht verändernde Aufrufe.                                            |
| `operator.write`        | Verändernde Operatoraktionen: Nachrichten senden, Tools aufrufen, Gesprächs-/Spracheinstellungen aktualisieren, Node-Befehle weiterleiten. Erfüllt auch `operator.read`. |
| `operator.admin`        | Administrativer Zugriff. Erfüllt jeden `operator.*`-Bereich. Erforderlich für Konfigurationsänderungen, Aktualisierungen, native Hooks, reservierte Namespaces und Genehmigungen mit hohem Risiko. |
| `operator.pairing`      | Verwaltung der Geräte- und Node-Kopplung: auflisten, genehmigen, ablehnen, entfernen, rotieren, widerrufen.                                                    |
| `operator.approvals`    | APIs für Exec- und Plugin-Genehmigungen.                                                                                                                       |
| `operator.questions`    | Interaktive Fragen auflisten, lesen, beantworten und erledigen.                                                                                               |
| `operator.talk.secrets` | Talk-Konfiguration einschließlich Geheimnissen lesen.                                                                                                         |

Unbekannte zukünftige `operator.*`-Bereiche erfordern eine exakte Übereinstimmung, sofern der Aufrufer
nicht bereits über `operator.admin` verfügt.

## Der Methodenbereich ist nur die erste Schranke

Jede Gateway-RPC verfügt über einen Methodenbereich nach dem Prinzip der geringsten Rechte, der entscheidet, ob eine
Anfrage ihren Handler erreicht. Parameterabhängige Methoden leiten diesen Bereich vor der
Weiterleitung ab, sodass Autorisierungsfehler eine einzige kanonische strukturierte Antwort besitzen:

- `agent` benötigt `operator.write` für gewöhnliche Durchläufe und `operator.admin` für
  die Sitzungslebenszyklusbefehle `/new` oder `/reset`.
- `node.invoke` benötigt `operator.write` für gewöhnliche Weiterleitungsbefehle und
  `operator.admin` für `browser.proxy`, `fs.listDir` und `terminal.upload`.
- `talk.config` benötigt `operator.read`; `includeSecrets: true` benötigt außerdem
  `operator.talk.secrets`.

Einige Handler führen anschließend strengere Prüfungen anhand des konkret
genehmigten oder veränderten Objekts durch:

- `device.pair.approve` ist mit `operator.pairing` erreichbar, aber bei der Genehmigung eines
  Operatorgeräts können nur Bereiche ausgestellt oder beibehalten werden, über die der Aufrufer bereits verfügt.
- `node.pair.approve` ist mit `operator.pairing` erreichbar und leitet anschließend zusätzliche
  Genehmigungsbereiche aus der deklarierten Befehlsliste des ausstehenden Nodes ab.
- `chat.send` ist eine Methode mit Schreibbereich, aber die Chatbefehle `/config set` und
  `/config unset` erfordern darüber hinaus `operator.admin`,
  unabhängig vom Bereich des Aufrufers zum Senden von Chatnachrichten.

Dadurch können Operatoren mit eingeschränkteren Bereichen Kopplungsaktionen mit geringem Risiko durchführen,
ohne sämtliche Kopplungsgenehmigungen auf Administratoren zu beschränken.

RPCs für Sitzungsänderungen werden anhand ihrer ausgehandelten Operator-Bereiche autorisiert,
unabhängig vom `client.id` oder `client.mode` des verbindenden Clients. Die Clientidentität
kann sich weiterhin auf die Verbindungs- und Geräteauthentifizierungsrichtlinie auswirken, erteilt
oder entzieht jedoch keine Berechtigung zur Änderung von Sitzungen.

## Genehmigungen für die Gerätekopplung

Datensätze zur Gerätekopplung sind die dauerhafte Quelle genehmigter Rollen und Bereiche.
Ein bereits gekoppeltes Gerät erhält nicht stillschweigend umfassenderen Zugriff: Eine erneute Verbindung,
die eine umfassendere Rolle oder umfassendere Bereiche anfordert, erzeugt eine neue ausstehende
Upgrade-Anfrage.

Beim Genehmigen einer Geräteanfrage gilt:

- Eine Anfrage ohne Operatorrolle benötigt keine Genehmigung für Operator-Bereiche.
- Eine Anfrage für eine Gerätefunktion ohne Operatorrolle (zum Beispiel `node`) erfordert
  `operator.admin`, obwohl `device.pair.approve` selbst nur
  `operator.pairing` benötigt.
- Eine Anfrage für `operator.read`, `operator.write`, `operator.approvals`,
  `operator.questions`, `operator.pairing` oder `operator.talk.secrets` setzt voraus,
  dass der Aufrufer bereits über diesen Bereich oder über `operator.admin` verfügt.
- Eine Anfrage für `operator.admin` erfordert `operator.admin`.
- Eine Reparaturanfrage ohne explizite Bereiche kann die Bereiche des vorhandenen
  Operator-Tokens übernehmen; verfügt dieses Token über einen Administratorbereich, erfordert die Genehmigung
  weiterhin `operator.admin`.

Sitzungen mit gemeinsamem Geheimnis und Trusted Proxy ohne Administratorrechte können Anfragen für
Operatorgeräte nur innerhalb ihrer eigenen deklarierten Operator-Bereiche genehmigen; die Genehmigung
von Rollen ohne Operatorrechte ist ausschließlich Administratoren vorbehalten, selbst wenn diese Sitzungen ansonsten
`operator.pairing` verwenden können.

Bei Sitzungen mit Tokens gekoppelter Geräte ist die Verwaltung auf das eigene Gerät beschränkt, sofern der Aufrufer
nicht über `operator.admin` verfügt: Ein Aufrufer ohne Administratorrechte sieht nur seine eigenen Kopplungseinträge und
kann nur seinen eigenen Geräteeintrag genehmigen, ablehnen, rotieren, widerrufen oder entfernen.

## Genehmigungen für die Node-Kopplung

Veraltete `node.pair.*`-Methoden verwenden einen separaten, vom Gateway verwalteten Speicher für Node-Kopplungen.
WS-Nodes verwenden stattdessen die Gerätekopplung (`role: node`), es gilt jedoch dasselbe
Genehmigungsvokabular. Unter [Gateway-Kopplung](/de/gateway/pairing) erfahren Sie, wie die beiden
Speicher zusammenhängen.

`node.pair.approve` leitet zusätzliche erforderliche Bereiche aus der Befehlsliste der ausstehenden Anfrage ab:

| Deklarierte Befehle                                                                                                  | Erforderliche Bereiche                  |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| keine                                                                                                                | `operator.pairing`                      |
| gewöhnliche Node-Befehle                                                                                             | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` oder `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Die Genehmigung einer Node-Deklaration aktiviert keine Befehle, die über eine separate
Laufzeit-Zulassungsliste abgesichert sind. Beispielsweise erfordert die Genehmigung eines Nodes, der
`computer.act` deklariert, einen Kopplungs- und Schreibbereich, zeichnet jedoch nur die Schnittstelle auf.
Ein Administrator oder Eigentümer muss `computer.act` weiterhin aktivieren. Solange es
aktiviert bleibt, erfordert sein Aufruf über `node.invoke` einen Schreibbereich, jedoch nicht für jede
Aktion einen Administratorbereich.

Die Node-Kopplung stellt Identität und Vertrauen her; sie ersetzt nicht die eigene
Exec-Genehmigungsrichtlinie `system.run` eines Nodes.

## Authentifizierung mit gemeinsamem Geheimnis

Die Authentifizierung über ein gemeinsames Gateway-Token oder -Passwort wird für dieses Gateway als vertrauenswürdiger
Operatorzugriff behandelt. OpenAI-kompatible HTTP-Schnittstellen, `/tools/invoke` und HTTP-Endpunkte
für den Sitzungsverlauf stellen bei Bearer-Authentifizierung mit gemeinsamem Geheimnis den vollständigen Satz standardmäßiger Operator-Bereiche wieder her,
selbst wenn ein Aufrufer eingeschränktere deklarierte Bereiche sendet.

Identitätstragende Modi wie die Trusted-Proxy-Authentifizierung oder `none` über privaten Eingang
können explizit deklarierte Bereiche weiterhin berücksichtigen. Verwenden Sie separate Gateways für eine echte Trennung
von Vertrauensgrenzen.
