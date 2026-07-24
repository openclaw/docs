---
read_when:
    - Sie möchten, dass OpenClaw den aktiven Mac identifiziert
    - Sie debuggen die Aktivität der letzten Eingabe oder die Auswahl des aktiven Nodes
    - Sie möchten das Routing von Node-Verbindungsbenachrichtigungen verstehen
summary: Den zuletzt verwendeten Mac erkennen und Node-Warnmeldungen dorthin weiterleiten
title: Aktive Computerpräsenz
x-i18n:
    generated_at: "2026-07-24T03:56:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f1d1d0e98b1f3b7478cf80696dc693677b57897b07260cce30938e9187c314
    source_path: nodes/presence.md
    workflow: 16
---

Die aktive Computerpräsenz teilt dem Gateway mit, welcher verbundene macOS-Node
zuletzt eine physische Maus- oder Tastatureingabe empfangen hat. OpenClaw verwendet dieses Signal, um
einen Mac als `active` zu markieren, dem Agenten einen stabilen Hinweis auf den aktiven Node zu geben und
Benachrichtigungen über Node-Verbindungen an den Computer weiterzuleiten, an dem Sie sich höchstwahrscheinlich befinden.

Dies ist von der [Systempräsenz](/de/concepts/presence), also der aktuellen
Liste der Gateway-Clients, sowie von dauerhaften `node.presence.alive`-Signalen getrennt, die
aufzeichnen, wann ein mobiler Node zuletzt reaktiviert wurde, ohne ihn als verbunden zu behandeln.

## Voraussetzungen

- Die OpenClaw-macOS-App ist gekoppelt und im Node-Modus verbunden.
- **Settings -> Permissions -> Active computer detection** ist aktiviert. Standardmäßig ist diese Option deaktiviert.
- Der signierten OpenClaw-App wurde die Berechtigung **Accessibility** erteilt.
- Für Verbindungsbenachrichtigungen wurde außerdem die Berechtigung **Notifications** erteilt und der
  Mac-Node stellt `system.notify` bereit.

Die Aktivitätsmeldung wird derzeit vom nativen macOS-Node implementiert. iOS-,
Android- und watchOS-Nodes sowie monitorlose Node-Hosts können den Verbindungsstatus oder den
Zeitpunkt der letzten Hintergrundaktivität melden, konkurrieren jedoch nicht um die Einstufung als aktiver Computer.

## Aktiven Computer überprüfen

1. Öffnen Sie in der macOS-App **Settings -> Permissions**, aktivieren Sie
   **Active computer detection** und erteilen Sie in den macOS-Systemeinstellungen die Berechtigung **Accessibility**.
2. Vergewissern Sie sich, dass der Mac-Node verbunden ist:

   ```bash
   openclaw nodes status --connected
   ```

3. Bewegen Sie die Maus oder drücken Sie eine Taste auf diesem Mac und führen Sie dann Folgendes aus:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Der aktuellste geeignete Mac wird mit `active` markiert. Die Statusausgabe zeigt die seit seiner letzten Eingabe
vergangene Zeit an; `describe` stellt `active`, `lastActiveAtMs` und `presenceUpdatedAtMs` bereit.
Aktivitätsmeldungen werden absichtlich zusammengefasst. Daher kann es nach einer kürzlich erfolgten Meldung bis zu etwa 15
Sekunden dauern, bis eine weitere Eingabe angezeigt wird.

## Wie Aktivität zur Präsenz wird

Der macOS-Reporter liest alle zwei Sekunden die Leerlaufzeit der HID-Systemuhr aus. Er
sendet einmalig eine Meldung, sobald eine Node-Verbindung bereit ist, und meldet anschließend neuere physische
Aktivität höchstens einmal alle 15 Sekunden. Im Leerlauf sendet er alle drei Minuten ein
Keepalive-Signal. Die Leerlaufdauer ist auf 30 Tage begrenzt, damit sich eine sehr alte Messung
nicht nach vorn verschieben und fälschlicherweise zum neuesten Computer werden kann.

Durch das Deaktivieren von **Active computer detection** wird die Erfassung beendet und über die aktuelle
Node-Verbindung ein authentifiziertes Löschereignis gesendet. Das Gateway entfernt unverzüglich
die gespeicherten Aktivitätszeitstempel dieses Macs und ermittelt den aktiven Computer neu;
andere Node-Funktionen und laufende Arbeiten bleiben verbunden. Falls das verbundene
Gateway älter als diese Löschaktion ist, stellt der Mac-Node die Verbindung einmal neu her, damit
die Bereinigung beim Trennen stattdessen die gespeicherte Aktivität entfernen kann.

Das Gateway akzeptiert Aktivität nur, wenn alle folgenden Bedingungen erfüllt sind:

- Das Ereignis gehört zur aktuellen authentifizierten Verbindung für diese Node-ID;
- der Node verfügt tatsächlich über die Berechtigung `accessibility: true`;
- die Nutzlast enthält für `idleSeconds` einen begrenzten Ganzzahlwert.

Das Gateway zieht `idleSeconds` von seiner eigenen Beobachtungszeit ab, um
`lastActiveAtMs` zu bestimmen. Es vertraut niemals einem vom Node bereitgestellten Zeitstempel der Systemuhr. Unter
den verbundenen geeigneten Macs gewinnt der neueste Wert für `lastActiveAtMs`; bei Gleichstand entscheidet die
aktuellste Präsenzaktualisierung.

Die Präsenz ist prozesslokal und an die Verbindung gebunden. Wenn die aktuelle
Sitzung getrennt, durch eine andere Sitzung mit derselben Node-ID ersetzt oder die
Berechtigung „Accessibility“ widerrufen wird, wird der Aktivitätsstatus dieses Nodes gelöscht und der aktive Mac neu ermittelt.

## Datenschutz und Modellkontext

Die Aktivitätsfreigabe ist standardmäßig deaktiviert und von der für die UI-Automatisierung
verwendeten Accessibility-Berechtigung getrennt. OpenClaw sendet die Leerlaufdauer, nicht den Inhalt der Eingaben. Es sendet keine Tastenwerte,
Mauskoordinaten, Anwendungsnamen, Fenstertitel oder rohen Eingabeereignisse. Der
macOS-Reporter liest den Hardware-HID-Status aus. Daher lassen synthetische Ereignisse zur Computersteuerung
einen automatisierten Mac nicht als den Computer erscheinen, den Sie physisch
verwendet haben.

Kontinuierliche Aktivität erzeugt keine systemseitigen Ereignisse für das Modell. Die dynamische
Laufzeitzeile enthält nur die authentifizierte Node-ID:

```text
active_node=<node-id>
```

Exakte Zeitstempel und vom Node gesteuerte Anzeigenamen bleiben aus dem Prompt ausgeschlossen, um
Prompt-Injection und Cache-Fluktuation zu vermeiden. Wenn der Agent aktuelle Details benötigt,
kann das Tool `nodes` stattdessen `node.list` oder `node.describe` auslesen.

## Weiterleitung von Verbindungsbenachrichtigungen

Nachdem ein Node nach der Genehmigung seinen ersten erfolgreichen Gateway-Handshake abgeschlossen hat,
wartet OpenClaw 750 Millisekunden, damit der sich verbindende Mac seine erste
Aktivitätsmessung übermitteln kann. Anschließend versucht OpenClaw, die Benachrichtigung an den verbundenen benachrichtigungsfähigen Mac mit der
aktuellsten Aktivität zu senden.

- Wenn die primäre Zustellung erfolgreich ist, erhält kein anderer Mac die Benachrichtigung.
- Wenn kein aktiver Mac verfügbar ist oder die primäre Zustellung fehlschlägt, wartet OpenClaw fünf
  Sekunden und versucht es bei jedem verbleibenden verbundenen Mac, der `system.notify` bereitstellt.
- Spätere Neuverbindungen erfolgen ohne Benachrichtigung. Das Gateway zeichnet die erfolgreiche Verbindung
  in den Kopplungsmetadaten auf, sodass bei einem Neustart des Gateways nicht erneut Benachrichtigungen für jeden
  zuvor verbundenen Node ausgelöst werden.

Benachrichtigungen sind an die authentifizierte Node-Identität gebunden. Eine Ersatzsitzung für
denselben Node übernimmt dessen ausstehende Benachrichtigung über die erste Verbindung. Wenn dieser Node zum
Zeitpunkt der Zustellung nicht mehr verbunden ist, wird die Benachrichtigung verworfen.

## Fehlerbehebung

| Symptom                                   | Prüfen                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keine Zeile ist mit `active` markiert                 | Vergewissern Sie sich, dass die Erkennung des aktiven Computers aktiviert und ein nativer macOS-Node verbunden ist sowie `openclaw nodes describe --node <id>` den Wert `permissions.accessibility: true` anzeigt.   |
| Der falsche Mac bleibt aktiv              | Bedienen Sie diesen Mac physisch, warten Sie das Zusammenfassungsintervall ab und führen Sie `openclaw nodes status` dann erneut aus. Synthetische Computersteuerungsaktionen werden nicht berücksichtigt.                        |
| Daten zur letzten Eingabe verschwinden                | Prüfen Sie, ob die Verbindung zum Mac getrennt, seine Node-Sitzung ersetzt oder die Accessibility-Berechtigung widerrufen wurde. Jede dieser Bedingungen löscht die Aktivität absichtlich.                       |
| Die Benachrichtigung erscheint auf mehreren Macs         | Die primäre Zustellung war nicht verfügbar oder ist fehlgeschlagen, sodass die verzögerte Ausweichzustellung ausgeführt wurde. Vergewissern Sie sich, dass der aktive Mac verbunden ist, Benachrichtigungen zulässt und `system.notify` bereitstellt. |
| Der Agent erwähnt den aktiven Mac nicht | Beginnen Sie nach Aktivitätsänderungen einen neuen Turn. Der Laufzeithinweis ist stabil und kompakt; verwenden Sie das Tool `nodes` für exakte aktuelle Metadaten.                                    |

Informationen zur TCC-Wiederherstellung finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions). Informationen zu
Node-Verbindungs- und Befehlsfehlern finden Sie unter [Fehlerbehebung für Nodes](/de/nodes/troubleshooting).

## Verwandte Themen

- [Nodes](/de/nodes)
- [Nodes-CLI](/de/cli/nodes)
- [Systempräsenz](/de/concepts/presence)
- [Gateway-Protokoll](/de/gateway/protocol#presence)
- [macOS-App](/de/platforms/macos)
