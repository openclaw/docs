---
read_when:
    - Sie möchten, dass ein Agent Ihr echtes, angemeldetes Chrome über Ihr Smartphone steuert
    - Sie stoßen immer wieder auf die Chrome-Abfrage „Allow remote debugging?“, obwohl niemand am Schreibtisch sitzt
    - Sie möchten das Sicherheitsmodell der Browserübernahme über die Erweiterung verstehen
summary: 'Chrome-Erweiterung: Lassen Sie OpenClaw Ihr angemeldetes Chrome ohne Aufforderung zum Remote-Debugging steuern'
title: Chrome-Erweiterung
x-i18n:
    generated_at: "2026-07-24T05:19:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3d974f62bb5697a23dd6a6852137ce6af5a8a4a2a8ff738eec0098f259e8faa0
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome-Erweiterung

Mit der OpenClaw-Chrome-Erweiterung kann ein Agent Ihre **angemeldeten Chrome-
Tabs** steuern, ohne einen separaten verwalteten Browser zu starten und **ohne**
Chromes blockierende Aufforderung „Allow remote debugging?“.

Das ist relevant, wenn Sie OpenClaw von einem Telefon aus steuern (Telegram, WhatsApp usw.):
Das [`user`-Profil](/de/tools/browser#profiles-openclaw-user-chrome) stellt über
Chromes Port für Remote-Debugging eine Verbindung her, wodurch ein Zustimmungsdialog auf dem
Desktop erscheint, den niemand anklicken kann, während Sie nicht vor Ort sind. Die Erweiterung
verwendet stattdessen die `chrome.debugger`-API, sodass der einzige Hinweis auf der Seite
Chromes ausblendbares Banner „OpenClaw started debugging
this browser“ ist.

Dies entspricht dem Ansatz, den die Chrome-Erweiterungen von Anthropic Claude und OpenAI Codex
verwenden.

## Funktionsweise

Drei Bestandteile:

- **Browser-Steuerungsdienst** (Gateway oder Node-Host): die API, die das Werkzeug `browser`
  aufruft.
- **Erweiterungs-Relay** (Loopback-WebSocket): ein kleiner Server, den der Steuerungsdienst
  unter `127.0.0.1` startet. Er stellt OpenClaw einen Endpunkt für das Chrome DevTools Protocol
  bereit und kommuniziert mit der Erweiterung. Beide Seiten authentifizieren sich mit einem
  hostlokalen Token (siehe unten).
- **OpenClaw-Chrome-Erweiterung** (MV3): verbindet sich über `chrome.debugger` mit Tabs,
  leitet CDP-Datenverkehr weiter und verwaltet die **OpenClaw-Tabgruppe**.

OpenClaw sieht und steuert nur Tabs, die sich in der **OpenClaw-Tabgruppe** befinden. Die
Gruppe bildet die Zustimmungsgrenze: Ziehen Sie einen Tab hinein, um ihn freizugeben, und
ziehen Sie ihn heraus (oder klicken Sie auf die Symbolleistenschaltfläche), um den Zugriff
sofort zu widerrufen.

## Installieren und koppeln

1. Pfad der entpackten Erweiterung ausgeben:

   ```bash
   openclaw browser extension path
   ```

2. Öffnen Sie `chrome://extensions`, aktivieren Sie **Developer mode**, klicken Sie auf **Load
   unpacked** und wählen Sie das ausgegebene Verzeichnis aus.

3. Kopplungszeichenfolge ausgeben:

   ```bash
   openclaw browser extension pair
   ```

4. Klicken Sie auf das OpenClaw-Symbol in der Symbolleiste und fügen Sie die Kopplungszeichenfolge
   in das Pop-up ein. Das Badge wechselt zu **ON**, wenn die Erweiterung eine Verbindung
   zum Relay herstellt.

Das Kopplungstoken ist ein **hostlokales Geheimnis**, das bei der ersten Verwendung erstellt und
unter `credentials/` im Zustandsverzeichnis gespeichert wird (Modus `0600`). Jeder Rechner,
auf dem ein Browser ausgeführt wird – der Gateway-Host und jeder Browser-Node-Host – besitzt ein eigenes
Token, sodass keine Anmeldedaten zwischen Rechnern übertragen werden müssen. Um es zu rotieren, löschen Sie
die Datei `browser-extension-relay.secret` und führen Sie die Kopplung erneut durch.

## Verwendung

Wählen Sie das integrierte Profil `chrome` in einem Aufruf des Werkzeugs `browser` aus
oder legen Sie es als Standard fest:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Tab freigeben: Klicken Sie in diesem Tab auf die OpenClaw-Schaltfläche in der Symbolleiste
  (dadurch wird er der OpenClaw-Tabgruppe hinzugefügt) oder ziehen Sie einen beliebigen Tab in die Gruppe.
- Der Agent kann auch neue Tabs öffnen; diese werden automatisch der Gruppe hinzugefügt.
- Zugriff widerrufen: Klicken Sie erneut auf die Schaltfläche, ziehen Sie den Tab aus der Gruppe
  oder schließen Sie Chromes Debugging-Banner. Der Agent verliert sofort den Zugriff auf diesen Tab.

### Tab-Copilot-Seitenleiste

Klicken Sie nach dem Koppeln der Erweiterung im Pop-up der Symbolleiste auf **Open tab copilot**.
OpenClaw konfiguriert `sidepanel.html` für genau diesen Chrome-Tab; das Manifest enthält
keinen globalen Seitenleistenpfad. Jeder Tab erhält daher ein separates Seitenleistendokument,
eine eigene Gateway-Sitzung, ein eigenes Nachrichtenabonnement und eine typisierte Bindung an
Browser-Werkzeuge.

Die Seitenleiste fügt weder die Seiten-URL noch den Titel, das DOM oder sichtbaren Text in Ihre
Nachricht ein. Sie sendet nur den von Ihnen eingegebenen Text. Browseraktionen führen eine separate,
vom Gateway authentifizierte Bindung mit, die den Chrome-Tab und das CDP-Ziel enthält. Das
Browser-Werkzeug weist Versuche zurück, dieses Ziel zu ersetzen oder browserweite Aktionen zu
verwenden. Antworten verbleiben in der Seitenleiste (`deliver: false`); sie übernehmen keine
Telegram-, Discord- oder andere Kanalroute.

Der Copilot ist ein dediziertes gekoppeltes Gateway-Gerät mit den Geltungsbereichen `operator.read`
und `operator.write`. Prüfen und genehmigen Sie bei der ersten Verwendung seine Anfrage:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Die Erweiterung behält diese Geräteidentität und das vom Gateway ausgestellte Gerätetoken bei,
beschränkt auf den kanonischen Gateway-Endpunkt, der sie ausgestellt hat. Durch die Kopplung mit
einem anderen Gateway entstehen separate Identitäten, Token und Sitzungsverwahrungen; Anmeldedaten
und Sitzungen werden niemals endpunktübergreifend wiederverwendet. Die Erweiterung speichert das
gemeinsame Gateway-Geheimnis nicht dauerhaft. Eine Seitenleiste kann nur ihre eigenen Tab-Sitzungen
abonnieren, und das Gateway filtert diese Ereignisse vor der Zustellung.

Wenn die Gateway-Verbindung während eines Durchlaufs abbricht, behält die Erweiterung die dauerhafte
Verwahrung dieser Durchlauf-ID. Nach dem erneuten Verbinden bricht sie den ungelösten Durchlauf ab,
bevor sie eine Seitenleiste wieder aktiviert, und lädt anschließend den Transkriptverlauf neu.
Dieser Fail-Closed-Schritt verhindert, dass Browseraktionen während einer Zustellungslücke unbemerkt
fortgesetzt werden.

Beim Schließen eines Tabs wird dessen aktives Abonnement sofort entfernt, jeder sichtbare Durchlauf
abgebrochen und die Sitzung dieses Tabs als archiviert markiert. Wenn das Gateway vorübergehend offline
ist, speichert die Erweiterung die ausstehende Archivierung dauerhaft und versucht sie erst erneut, wenn
derselbe Gateway-Endpunkt wieder verbunden ist; sie sendet niemals eine Archivierungsanfrage an ein
anderes Gateway. Nach einem Browserabsturz archiviert der nächste Start Sitzungen, die von der vorherigen
Browserinstanz hinterlassen wurden. Archivierte Sitzungen weisen neue Aufgaben zurück, während ihre
Transkripte im Sitzungsverlauf verfügbar bleiben. Browser-Copilot-Schlüssel sind Thread-Sitzungen, sodass
die normale Wartung nach Alter und Eintragsanzahl sie erhält. Das Datenträgerbudget pro Agent für Sitzungen
gilt weiterhin (Standard: `2gb`) und kann bei Speicherknappheit die ältesten Sitzungen entfernen;
siehe [Sitzungswartung](/de/reference/session-management-compaction#store-maintenance-and-disk-controls).

Die Seitenleiste erfordert derzeit entweder ein vom Gateway gehostetes Erweiterungs-Relay oder ein direktes
Remote-Gateway-Relay. Ein Loopback-Relay auf einem Browser-Node kann die für die typisierte Tab-Bindung
erforderliche Node-Route noch nicht bereitstellen. Daher verweigert die Seitenleiste diese Topologie,
anstatt auf browserweites Routing zurückzufallen.

## Eine Seite an OpenClaw senden

Verwenden Sie **Send page to OpenClaw** im Pop-up der Symbolleiste, um lesbaren Seitentext
mit Ihrer OpenClaw-Hauptsitzung zu teilen. Sie können eine optionale Notiz hinzufügen, das
Kontextmenü der Seite oder Auswahl verwenden oder `Alt+Shift+S` drücken. OpenClaw bevorzugt
Ihre aktuelle Auswahl, sofern vorhanden, reiht die Freigabe als Systemereignis ein und aktiviert
die Hauptsitzung sofort.

Der Tab muss sich nicht in der OpenClaw-Tabgruppe befinden. Dies ist eine einmalige,
ausdrückliche Freigabe: Nichts anderes auf der Seite wird offengelegt, und es wird kein
fortlaufender Zugriff gewährt. Google Docs werden mit Ihrer angemeldeten Browsersitzung
als Klartext exportiert, ohne dass eine Google-API-Einrichtung erforderlich ist. X- und
Twitter-Threads werden ohne die umgebende Benutzeroberfläche extrahiert.

Der Seitentext wird in OpenClaws Sicherheitsgrenze für externe Inhalte eingeschlossen. Ihre
optionale Notiz bleibt als Ihre eigene Anweisung außerhalb dieser Grenze. Seitentext und
Auswahlen sind auf etwa 120.000 Zeichen begrenzt und enthalten bei Kürzung eine
Abschneidemarkierung.

Die Seitenfreigabe funktioniert, wenn das Erweiterungs-Relay vom Gateway gehostet wird, und
verwendet dabei eine Kopplung auf demselben Host oder eine direkte `wss://`-Gateway-Kopplung.
Von Nodes gehostete Relays geben derzeit einen eindeutigen Fehler zurück. Um das Tastenkürzel
neu zuzuordnen, öffnen Sie `chrome://extensions/shortcuts`.

## Remote / rechnerübergreifend

Chrome muss nicht auf dem Gateway-Host ausgeführt werden. Drei Topologien funktionieren:

- **Derselbe Host** (Gateway und Chrome auf einem Rechner): Koppeln Sie auf diesem Rechner
  mit `openclaw browser extension pair`. Das Relay ist ausschließlich über Loopback erreichbar.
  Wenn das lokale Gateway TLS verwendet, übergeben Sie den Hostnamen seines Zertifikats ausdrücklich
  mit `--gateway-url wss://gateway-host.example`; bei der Kopplung wird niemals ersatzweise eine Loopback-IP verwendet.
- **Direkt zu einem Remote-Gateway** (Chrome auf Ihrem Laptop, Gateway auf einem VPS und
  **nichts anderes auf dem Laptop**): Führen Sie auf dem Gateway
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com` aus.
  Der Befehl gibt eine `wss://…/browser/extension#<secret>`-Zeichenfolge aus; laden und koppeln Sie die
  Erweiterung auf dem Laptop. Die Erweiterung verbindet sich **direkt mit dem Gateway**
  über `wss://` – ohne OpenClaw-Installation, Node, CLI oder offenen eingehenden Port auf dem
  Laptop. Dies ist der Pfad für verwaltetes Hosting.
- **Über einen Browser-Node-Host** (Chrome auf einem Rechner, auf dem bereits ein OpenClaw-
  Node ausgeführt wird): Führen Sie `pair` auf dem Node aus und koppeln Sie lokal; das Gateway
  leitet Browseraktionen über die bestehende authentifizierte Node-Verbindung an den Node weiter.

Das Kopplungsgeheimnis gilt pro Host (im direkten Fall das des Gateways) und wird von der Route
`/browser/extension` des Gateways validiert. Stellen Sie das Gateway für den direkten Pfad
über TLS (`wss://`) bereit, damit das Kopplungsgeheimnis und der CDP-Datenverkehr
verschlüsselt sind. Das Geheimnis verbleibt im URL-Fragment der Kopplungszeichenfolge und wird
während des WebSocket-Handshakes als Subprotokoll-Anmeldedatum übermittelt, sodass normale
Proxy-Zugriffsprotokolle es nicht in der Anfrage-URL erhalten. Stellen Sie sicher, dass jeder
Reverse-Proxy den standardmäßigen Header `Sec-WebSocket-Protocol` beibehält.

## Diagnose

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` meldet die Prüfung des **Chrome-Erweiterungs-Relays** als fehlgeschlagen,
bis das Pop-up der Erweiterung **Connected** anzeigt.

## Sicherheitsmodell

- Das Relay bindet ausschließlich an Loopback; beide WebSocket-Seiten werden mit dem
  abgeleiteten Token authentifiziert, und auf der Erweiterungsseite wird der Ursprung gegen
  `chrome-extension://` geprüft.
- Bei der direkten Gateway-Kopplung wird das Relay-Token nicht in der Anfrage-URL akzeptiert;
  die gebündelte Erweiterung übermittelt es stattdessen in der WebSocket-Subprotokollliste.
- Der Agent kann nur Tabs in der **OpenClaw-Tabgruppe** sehen und steuern. Ihre
  anderen Tabs bleiben privat.
- Durchläufe in der Seitenleiste sind zweifach beschränkt: Die Gateway-Zustellung verwendet
  eine Zulassungsliste pro Sitzung, und Browser-Werkzeuge erzwingen die außerhalb des Prompts
  übermittelte Bindung an den Chrome-Tab bzw. das Ziel.
- Im Vergleich zum Profil `user` (Chrome MCP), das nach Ihrer Zustimmung zur
  Aufforderung für Remote-Debugging Ihren gesamten angemeldeten Browser offenlegt, beschränkt
  die Erweiterung die freigegebene Oberfläche auf eine Tabgruppe, die Sie auf einen Blick
  kontrollieren können.

Siehe auch: [Browser](/de/tools/browser) für das vollständige Profilmodell und die
verwalteten Profile `openclaw` und Chrome MCP `user`.
