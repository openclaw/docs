---
read_when:
    - Dem Gateway-Agenten ermöglichen, einen Mac-Schreibtisch anzuzeigen und zu steuern
    - Aktivierung, Berechtigungen oder Sicherheit bei der Computernutzung
    - Erweitern des Node-Befehls `computer.act` oder seiner Ausführer
summary: Agentengesteuerte Desktop-Steuerung auf einem gekoppelten macOS-Node über das Computer-Tool und den Node-Befehl `computer.act`
title: Computernutzung
x-i18n:
    generated_at: "2026-07-12T01:50:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Computer Use ermöglicht dem Gateway-Agenten, einen gekoppelten **macOS**-Desktop zu sehen und zu steuern: Das Tool erfasst mit dem vorhandenen Node-Befehl `screen.snapshot` einen Screenshot und steuert Zeiger und Tastatur über einen einzigen gefährlichen Node-Befehl, `computer.act`. Der Aktionsumfang entspricht den zentralen Computer-Use-Aktionen von Anthropic; der optionale Zoom von `computer_20251124` wird nicht bereitgestellt. Ein bildverarbeitungsfähiges Modell steuert den Desktop über das integrierte Agenten-Tool `computer`.

Der Agent gibt einen einheitlichen Befehl aus, `computer.act`; er kann nicht erkennen, wie ein Node ihn ausführt. Ein macOS-Node führt `computer.act` innerhalb des Prozesses mit eingebetteten Peekaboo-Diensten und eng begrenzten CoreGraphics-Primitiven aus (korrekte TCC-Berechtigungen, kein zusätzlicher Prozess). Andere Plattformen können denselben Befehl später ausführen, ohne den Vertrag gegenüber dem Agenten zu ändern.

## Voraussetzungen

- Ein gekoppelter **macOS**-Node (die OpenClaw-macOS-App im Node-Modus).
- Die macOS-App-Einstellung **Computersteuerung zulassen** ist aktiviert (Standard: deaktiviert).
- Die macOS-Berechtigung **Bedienungshilfen** wurde OpenClaw erteilt (für die Zeiger-/Tastatureingabe), ebenso die Berechtigung **Bildschirmaufnahme** (für `screen.snapshot`).
- Der Befehl `computer.act` ist am Gateway freigeschaltet (er ist gefährlich und standardmäßig gesperrt).
- Ein bildverarbeitungsfähiges Agentenmodell.
- Eine Tool-Richtlinie, die `computer` bereitstellt. Das standardmäßige Profil `coding` stellt es nicht bereit. Fügen Sie `computer` zu `tools.alsoAllow` hinzu; Agenten in einer Sandbox benötigen es außerdem in `tools.sandbox.tools.alsoAllow`.

## Das Agenten-Tool `computer`

Das integrierte Tool `computer` akzeptiert pro Aufruf eine Aktion. Koordinaten sind nicht negative ganzzahlige Pixel im neuesten Screenshot; der Node ordnet sie Bildschirmpunkten zu. Koordinatenaktionen müssen die `frameId` des Screenshot-Ergebnisses wiederholen, und ein expliziter `screenIndex` muss mit diesem Frame übereinstimmen. OpenClaw überträgt außerdem eine vom Node ausgegebene Bildschirmidentität aus dem Screenshot in die Aktion, sodass eine erneute Verbindung des Bildschirms oder eine Geometrieänderung sicher fehlschlägt, statt unbemerkt denselben Index neu zuzuordnen. Diese Prüfungen lehnen erratene Token sowie Token aus einem anderen ausgelieferten Frame oder Bildschirm ab. Ein Token garantiert keine Aktualität: Apps können die Pixel auf demselben Bildschirm nach der Aufnahme ändern. Erstellen Sie daher einen neuen Screenshot, wenn sich die Ansicht möglicherweise geändert hat.

- Lesen: `screenshot`.
- Zeiger: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (mit `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Scrollen: `scroll` mit `scrollDirection` (`up|down|left|right`) und `scrollAmount` (Mausradschritte).
- Tastatur: `type` (Text), `key` (Tastenkombination wie `cmd+shift+t` oder `Return`), `hold_key` (`text`-Kombination, die für `duration` Sekunden gehalten wird).
- Ablaufsteuerung: `wait` (`duration` Sekunden).

Modifikatortasten werden bei Klick- und Scrollaktionen über das Feld `text` übergeben (`shift`, `ctrl`, `alt`, `cmd`). Nach einer Eingabeaktion gibt das Tool einen neuen Screenshot zurück, damit das Modell das Ergebnis erfassen kann. Wenn mehrere Computer-Use-fähige Nodes verbunden sind, geben Sie `node` ausdrücklich an.

Screenshots bleiben **ausschließlich für das Modell bestimmt**: Sie werden niemals automatisch an den Chatkanal ausgeliefert. Behandeln Sie alle Bildschirminhalte als nicht vertrauenswürdige Eingaben; das Tool warnt das Modell davor, Bildschirmanweisungen zu befolgen, die der Anfrage des Benutzers widersprechen.

## Der Node-Befehl `computer.act`

`computer.act` ist der einzige Node-Befehl, über den das Tool Eingaben weiterleitet (`node.invoke` mit `command: "computer.act"`). Er ist:

- **Standardmäßig gefährlich**: Er ist in den integrierten gefährlichen Node-Befehlen aufgeführt und von der Laufzeit-Zulassungsliste ausgeschlossen, bis er ausdrücklich freigeschaltet wird. Ein macOS-Node kann ihn dennoch beim Koppeln deklarieren, sodass die Schnittstelle einmalig genehmigt wird.
- **Derzeit nur für macOS verfügbar**: Er wird nur von einem macOS-Node bekannt gegeben, bei dem **Computersteuerung zulassen** aktiviert ist.

Lesevorgänge verwenden `screen.snapshot` erneut; es gibt keinen zweiten Aufnahmepfad. Informationen zum gemeinsam genutzten Aufnahmebefehl finden Sie unter [Kamera- und Bildschirm-Nodes](/de/nodes/camera).

## Aktivieren und freischalten

1. Aktivieren Sie in der macOS-App **Settings → Allow Computer Control**. Öffnen Sie anschließend **Settings → Permissions** und erteilen Sie in den macOS-Systemeinstellungen die Berechtigungen **Accessibility** und **Screen Recording**.
2. Genehmigen Sie die Aktualisierung der Kopplung am Gateway (ein neuer Befehl erzwingt eine erneute Kopplung).
3. Stellen Sie das Tool dem bildverarbeitungsfähigen Agenten bereit. Für das standardmäßige Profil `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Agenten in einer Sandbox benötigen auch diese zweite Freigabe:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Schalten Sie `computer.act` für einen begrenzten Zeitraum frei. Das Plugin `phone-control` stellt eine Gruppe `computer` bereit:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Die Freischaltung erfordert `operator.admin` (oder den Eigentümer) und läuft automatisch ab. Die veraltete Gruppe `/phone arm all` schließt die Desktopsteuerung absichtlich aus; verwenden Sie die ausdrückliche Gruppe `computer`. Die Freischaltung legt nur fest, was das Gateway aufrufen darf; die macOS-App erzwingt weiterhin ihre Einstellung **Computersteuerung zulassen** sowie die Betriebssystemberechtigungen.

Fügen Sie für eine dauerhafte Autorisierung `computer.act` zu `gateway.nodes.allowCommands` hinzu **und entfernen Sie es aus** `gateway.nodes.denyCommands`; die Sperrliste hat Vorrang. Eine dauerhafte Autorisierung läuft nicht automatisch ab. Einträge, die bereits vor `/phone arm` vorhanden waren, bleiben nach `/phone disarm` erhalten; wandeln Sie eine temporäre Gewährung nicht während der Freischaltung in eine dauerhafte um.

Die Autorisierung ist bewusst in Aktivierung und Nutzung unterteilt. Das Freischalten oder
dauerhafte Konfigurieren von `computer.act` erfordert administrative Berechtigungen.
Nach der Freischaltung kann ein authentifizierter Operator mit `operator.write`
`computer.act` über `node.invoke` aufrufen, bis die Gewährung abläuft oder aufgehoben wird;
es erfolgt keine Administratorprüfung für jede einzelne Aktion. Die Genehmigung eines Nodes, der
`computer.act` deklariert, erfasst lediglich die Schnittstelle, damit sie später freigeschaltet werden kann, und
ermöglicht für sich genommen keinen Aufruf.

## Sicherheit

- Vor der Autorisierung müssen alle Ebenen zustimmen (Tool-Richtlinie, Gateway-Befehlsrichtlinie, macOS-Einstellung, Bedienungshilfen und Bildschirmaufnahme). Nach der Freischaltung werden Aktionen bis zum Ablauf oder bis zu `/phone disarm` ohne Bestätigung für jede einzelne Aktion ausgeführt.
- Texteingaben werden jeweils ein Graphem nach dem anderen gesendet. Abbruch, Verbindungsunterbrechung, Pausierung, Deaktivierung oder Ersetzung des Endpunkts stoppen die Eingabe vor dem nächsten Graphem, statt den veralteten Rest weiter auszuführen.
- Screenshots sind ausschließlich für das Modell bestimmt und werden niemals automatisch an den Chat gesendet (Issue [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Behandeln Sie Bildschirminhalte als nicht vertrauenswürdig; sie können Prompt-Injection enthalten.

## Beziehung zu anderen Pfaden für die Desktopsteuerung

Dies ist der vom Agenten gesteuerte Pfad. Unter [Peekaboo-Bridge](/de/platforms/mac/peekaboo) erfahren Sie, wie er mit dem PeekabooBridge-Host, Codex Computer Use und dem direkten MCP `cua-driver` zusammenhängt.
