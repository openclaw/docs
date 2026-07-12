---
read_when:
    - Sie möchten, dass ein Agent Ihr tatsächlich angemeldetes Chrome von Ihrem Smartphone aus steuert
    - Sie erhalten immer wieder die Chrome-Abfrage „Allow remote debugging?“, obwohl niemand am Schreibtisch sitzt
    - Sie möchten das Sicherheitsmodell der Browserübernahme über die Erweiterung verstehen
summary: 'Chrome-Erweiterung: Lassen Sie OpenClaw Ihr angemeldetes Chrome ohne Aufforderung zum Remote-Debugging steuern'
title: Chrome-Erweiterung
x-i18n:
    generated_at: "2026-07-12T16:03:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome-Erweiterung

Mit der OpenClaw Chrome-Erweiterung kann ein Agent Ihre **angemeldeten Chrome-Tabs** steuern, ohne einen separaten verwalteten Browser zu starten und **ohne** die blockierende Chrome-Abfrage „Allow remote debugging?“.

Dies ist wichtig, wenn Sie OpenClaw von einem Mobiltelefon aus steuern (Telegram, WhatsApp usw.): Das [`user`-Profil](/de/tools/browser#profiles-openclaw-user-chrome) stellt eine Verbindung über den Remote-Debugging-Port von Chrome her. Dabei wird auf dem Desktop ein Zustimmungsdialog eingeblendet, den niemand anklicken kann, während Sie unterwegs sind. Die Erweiterung verwendet stattdessen die API `chrome.debugger`, sodass der einzige Hinweis auf der Seite das ausblendbare Chrome-Banner „OpenClaw started debugging this browser“ ist.

Denselben Ansatz verwenden auch die Chrome-Erweiterungen Claude in Chrome von Anthropic und Codex von OpenAI.

## Funktionsweise

Drei Bestandteile:

- **Browser-Steuerungsdienst** (Gateway oder Node-Host): die API, die das `browser`-Tool aufruft.
- **Erweiterungs-Relay** (Loopback-WebSocket): ein kleiner Server, den der Steuerungsdienst auf `127.0.0.1` startet. Er stellt OpenClaw einen Endpunkt für das Chrome DevTools Protocol bereit und kommuniziert mit der Erweiterung. Beide Seiten authentifizieren sich mit einem hostlokalen Token (siehe unten).
- **OpenClaw Chrome-Erweiterung** (MV3): Verbindet sich über `chrome.debugger` mit Tabs, leitet CDP-Datenverkehr weiter und verwaltet die **OpenClaw-Tabgruppe**.

OpenClaw kann nur Tabs sehen und steuern, die sich in der **OpenClaw-Tabgruppe** befinden. Die Gruppe bildet die Zustimmungsgrenze: Ziehen Sie einen Tab hinein, um ihn freizugeben, und ziehen Sie ihn heraus (oder klicken Sie auf die Schaltfläche in der Symbolleiste), um den Zugriff sofort zu widerrufen.

## Installieren und koppeln

1. Geben Sie den Pfad der entpackten Erweiterung aus:

   ```bash
   openclaw browser extension path
   ```

2. Öffnen Sie `chrome://extensions`, aktivieren Sie **Developer mode**, klicken Sie auf **Load unpacked** und wählen Sie das ausgegebene Verzeichnis aus.

3. Geben Sie die Kopplungszeichenfolge aus:

   ```bash
   openclaw browser extension pair
   ```

4. Klicken Sie auf das OpenClaw-Symbol in der Symbolleiste und fügen Sie die Kopplungszeichenfolge in das Pop-up ein. Das Badge zeigt **ON** an, sobald die Erweiterung mit dem Relay verbunden ist.

Das Kopplungstoken ist ein **hostlokales Geheimnis**, das bei der ersten Verwendung erstellt und im Zustandsverzeichnis unter `credentials/` gespeichert wird (Modus `0600`). Jeder Rechner, auf dem ein Browser ausgeführt wird – der Gateway-Host und jeder Browser-Node-Host – besitzt sein eigenes Token, sodass keine Anmeldedaten zwischen Rechnern übertragen werden müssen. Um es zu rotieren, löschen Sie die Datei `browser-extension-relay.secret` und führen Sie die Kopplung erneut durch.

## Verwendung

Wählen Sie das integrierte Profil `chrome` in einem Aufruf des `browser`-Tools aus oder legen Sie es als Standard fest:

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

- Tab freigeben: Klicken Sie in diesem Tab auf die OpenClaw-Schaltfläche in der Symbolleiste (dadurch wird er der OpenClaw-Tabgruppe hinzugefügt) oder ziehen Sie einen beliebigen Tab in die Gruppe.
- Der Agent kann auch neue Tabs öffnen; diese werden automatisch der Gruppe hinzugefügt.
- Zugriff widerrufen: Klicken Sie erneut auf die Schaltfläche, ziehen Sie den Tab aus der Gruppe oder schließen Sie das Debugging-Banner von Chrome. Der Agent verliert sofort den Zugriff auf diesen Tab.

## Remote-/rechnerübergreifender Betrieb

Chrome muss nicht auf dem Gateway-Host ausgeführt werden. Drei Topologien werden unterstützt:

- **Derselbe Host** (Gateway und Chrome auf einem Rechner): Koppeln Sie auf diesem Rechner mit `openclaw browser extension pair`. Das Relay ist nur über Loopback erreichbar.
- **Direkt mit einem entfernten Gateway** (Chrome auf Ihrem Laptop, Gateway auf einem VPS und **nichts Weiteres auf dem Laptop**): Führen Sie auf dem Gateway `openclaw browser extension pair --gateway-url wss://your-gateway.example.com` aus. Der Befehl gibt eine Zeichenfolge im Format `wss://…/browser/extension#<secret>` aus; laden und koppeln Sie die Erweiterung auf dem Laptop. Die Erweiterung verbindet sich über `wss://` **direkt mit dem Gateway** – auf dem Laptop sind weder eine OpenClaw-Installation noch Node, CLI oder ein offener eingehender Port erforderlich. Dies ist der Pfad für verwaltetes Hosting.
- **Über einen Browser-Node-Host** (Chrome auf einem Rechner, auf dem bereits eine OpenClaw-Node ausgeführt wird): Führen Sie `pair` auf der Node aus und koppeln Sie lokal; das Gateway leitet Browseraktionen über die vorhandene authentifizierte Node-Verbindung an die Node weiter.

Das Kopplungsgeheimnis gilt pro Host (im direkten Fall das des Gateways) und wird von der Route `/browser/extension` des Gateways validiert. Stellen Sie das Gateway für den direkten Pfad über TLS (`wss://`) bereit, damit das Kopplungsgeheimnis und der CDP-Datenverkehr verschlüsselt werden.
Das Geheimnis verbleibt im URL-Fragment der Kopplungszeichenfolge und wird während des WebSocket-Handshakes als Subprotokoll-Anmeldedatum übermittelt, sodass es nicht über die Anfrage-URL in normale Proxy-Zugriffsprotokolle gelangt. Stellen Sie sicher, dass ein vorgeschalteter Reverse-Proxy den Standard-Header `Sec-WebSocket-Protocol` beibehält.

## Diagnose

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` meldet die Prüfung des **Chrome-Erweiterungs-Relays** als fehlgeschlagen, bis im Pop-up der Erweiterung **Connected** angezeigt wird.

## Sicherheitsmodell

- Das Relay bindet ausschließlich an Loopback; beide WebSocket-Seiten werden mit dem abgeleiteten Token authentifiziert, und der Ursprung der Erweiterungsseite wird gegen `chrome-extension://` geprüft.
- Bei der direkten Gateway-Kopplung wird das Relay-Token nicht in der Anfrage-URL akzeptiert; die mitgelieferte Erweiterung überträgt es stattdessen in der Liste der WebSocket-Subprotokolle.
- Der Agent kann nur Tabs in der **OpenClaw-Tabgruppe** sehen und steuern. Ihre anderen Tabs bleiben privat.
- Im Vergleich zum Profil `user` (Chrome MCP), das Ihren gesamten angemeldeten Browser freigibt, sobald Sie die Remote-Debugging-Abfrage bestätigen, beschränkt die Erweiterung den freigegebenen Bereich auf eine Tabgruppe, die Sie auf einen Blick kontrollieren können.

Siehe auch: [Browser](/de/tools/browser) für das vollständige Profilmodell sowie die verwalteten Profile `openclaw` und Chrome MCP `user`.
