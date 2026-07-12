---
read_when:
    - Dem Gateway-Agenten ermöglichen, einen Mac-Schreibtisch zu sehen und zu steuern
    - Aktivierung, Berechtigungen oder Sicherheit bei der Computernutzung
    - Erweitern des Node-Befehls `computer.act` oder seiner Fulfillment-Handler
summary: Agentengesteuerte Desktop-Steuerung auf einem gekoppelten macOS-Node über das Computer-Tool und den Node-Befehl computer.act
title: Computernutzung
x-i18n:
    generated_at: "2026-07-12T15:28:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Computer Use ermöglicht es dem Gateway-Agenten, einen gekoppelten **macOS**-Desktop zu sehen und zu steuern: Er erstellt mit dem vorhandenen Node-Befehl `screen.snapshot` einen Screenshot und steuert Zeiger und Tastatur über einen einzigen gefährlichen Node-Befehl, `computer.act`. Der Aktionsumfang entspricht den zentralen Computer-Use-Aktionen von Anthropic; der optionale Zoom von `computer_20251124` wird nicht bereitgestellt. Ein visionfähiges Modell steuert ihn über das integrierte Agent-Tool `computer`.

Der Agent gibt einen einheitlichen Befehl aus, `computer.act`; er kann nicht erkennen, wie ein Node ihn ausführt. Ein macOS-Node führt `computer.act` prozessintern mit eingebetteten Peekaboo-Diensten sowie eng begrenzten CoreGraphics-Primitiven aus (korrekte TCC-Berechtigungen, kein zusätzlicher Prozess). Andere Plattformen können denselben Befehl künftig ausführen, ohne den Vertrag für den Agenten zu ändern.

## Voraussetzungen

- Ein gekoppelter **macOS**-Node (die OpenClaw-macOS-App im Node-Modus).
- Die macOS-App-Einstellung **Allow Computer Control** ist aktiviert (Standard: aus).
- OpenClaw wurde die macOS-Berechtigung **Accessibility** (für die Zeiger-/Tastatureingabe) sowie **Screen Recording** (für `screen.snapshot`) erteilt.
- Der Befehl `computer.act` ist am Gateway scharfgeschaltet (er ist gefährlich und standardmäßig nicht scharfgeschaltet).
- Ein visionfähiges Agentenmodell.
- Eine Tool-Richtlinie, die `computer` bereitstellt. Das Standardprofil `coding` tut dies nicht. Fügen Sie `computer` zu `tools.alsoAllow` hinzu; Agenten in einer Sandbox benötigen es außerdem in `tools.sandbox.tools.alsoAllow`.

## Das Agent-Tool `computer`

Das integrierte Tool `computer` akzeptiert einen Vorgang pro Aufruf. Koordinaten sind nicht negative ganzzahlige Pixel im neuesten Screenshot; der Node ordnet sie Bildschirmpunkten zu. Koordinatenaktionen müssen die `frameId` des Screenshot-Ergebnisses wiederholen, und ein expliziter `screenIndex` muss mit diesem Frame übereinstimmen. OpenClaw übernimmt außerdem eine vom Node ausgegebene Bildschirmidentität aus dem Screenshot in die Aktion, sodass bei einer erneuten Verbindung des Bildschirms oder einer Geometrieänderung die Aktion sicher fehlschlägt, statt stillschweigend denselben Index als neues Ziel zu verwenden. Diese Prüfungen lehnen erratene Token sowie Token aus einem anderen übermittelten Frame oder Bildschirm ab. Ein Token ist keine Aktualitätsgarantie: Apps können nach der Aufnahme Pixel auf demselben Bildschirm ändern. Erstellen Sie daher einen neuen Screenshot, sobald sich die Ansicht geändert haben könnte.

- Lesen: `screenshot`.
- Zeiger: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (mit `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Scrollen: `scroll` mit `scrollDirection` (`up|down|left|right`) und `scrollAmount` (Mausradschritte).
- Tastatur: `type` (Text), `key` (Kombination wie `cmd+shift+t` oder `Return`), `hold_key` (für `duration` Sekunden gehaltene `text`-Kombination).
- Zeitsteuerung: `wait` (`duration` Sekunden).

Modifikatortasten werden bei Klick- und Scrollaktionen im Feld `text` übergeben (`shift`, `ctrl`, `alt`, `cmd`). Nach einer Eingabeaktion gibt das Tool einen aktuellen Screenshot zurück, damit das Modell das Ergebnis beobachten kann. Wenn mehr als ein Computer-Use-fähiger Node verbunden ist, geben Sie `node` ausdrücklich an.

Screenshots bleiben **ausschließlich für das Modell bestimmt**: Sie werden niemals automatisch an den Chat-Kanal übermittelt. Behandeln Sie alle Bildschirminhalte als nicht vertrauenswürdige Eingaben; das Tool weist das Modell darauf hin, keine Anweisungen auf dem Bildschirm zu befolgen, die der Anfrage des Benutzers widersprechen.

## Der Node-Befehl `computer.act`

`computer.act` ist der einzige Node-Befehl, über den das Tool Eingaben weiterleitet (`node.invoke` mit `command: "computer.act"`). Er ist:

- **Standardmäßig gefährlich**: Er ist in den integrierten gefährlichen Node-Befehlen aufgeführt und von der Laufzeit-Zulassungsliste ausgeschlossen, bis er ausdrücklich scharfgeschaltet wird. Ein macOS-Node kann ihn dennoch beim Koppeln deklarieren, sodass die Schnittstelle einmalig genehmigt wird.
- Derzeit **nur für macOS** verfügbar: Er wird ausschließlich von einem macOS-Node angeboten, auf dem **Allow Computer Control** aktiviert ist.

Lesevorgänge verwenden erneut `screen.snapshot`; es gibt keinen zweiten Aufnahmepfad. Informationen zum gemeinsam verwendeten Aufnahmebefehl finden Sie unter [Kamera- und Bildschirm-Nodes](/de/nodes/camera).

## Aktivieren und scharfschalten

1. Aktivieren Sie in der macOS-App **Settings → Allow Computer Control**. Öffnen Sie dann **Settings → Permissions** und erteilen Sie in den macOS-Systemeinstellungen die Berechtigungen **Accessibility** und **Screen Recording**.
2. Genehmigen Sie die aktualisierte Kopplung am Gateway (ein neuer Befehl erzwingt eine erneute Kopplung).
3. Stellen Sie das Tool dem visionfähigen Agenten bereit. Für das Standardprofil `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Agenten in einer Sandbox benötigen auch diese zweite Freigabe:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Schalten Sie `computer.act` für einen begrenzten Zeitraum scharf. Das Plugin `phone-control` stellt eine Gruppe `computer` bereit:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Das Scharfschalten erfordert `operator.admin` (oder den Eigentümer) und läuft automatisch ab. Die veraltete Gruppe `/phone arm all` schließt die Desktop-Steuerung absichtlich aus; verwenden Sie die explizite Gruppe `computer`. Das Scharfschalten legt lediglich fest, was das Gateway aufrufen darf; die macOS-App erzwingt weiterhin ihre Einstellung **Allow Computer Control** und die Betriebssystemberechtigungen.

Fügen Sie für eine dauerhafte Autorisierung `computer.act` zu `gateway.nodes.allowCommands` hinzu **und entfernen Sie den Eintrag aus** `gateway.nodes.denyCommands`; die Sperrliste hat Vorrang. Eine dauerhafte Autorisierung läuft nicht automatisch ab. Einträge, die bereits vor `/phone arm` vorhanden waren, bleiben nach `/phone disarm` erhalten; wandeln Sie eine vorübergehende Freigabe nicht in eine dauerhafte um, während sie scharfgeschaltet ist.

Die Autorisierung ist bewusst in Aktivierung und Nutzung aufgeteilt. Das Scharfschalten oder
die dauerhafte Konfiguration von `computer.act` erfordert Administratorberechtigungen.
Nach dem Scharfschalten kann ein authentifizierter Operator mit `operator.write`
`computer.act` über `node.invoke` aufrufen, bis die Freigabe abläuft oder aufgehoben wird;
es gibt keine Administratorprüfung pro Aktion. Die Genehmigung eines Nodes, der
`computer.act` deklariert, erfasst lediglich die Schnittstelle, damit sie später scharfgeschaltet
werden kann, und ermöglicht nicht von selbst den Aufruf.

## Sicherheit

- Vor der Autorisierung müssen alle Ebenen (Tool-Richtlinie, Gateway-Befehlsrichtlinie, macOS-Einstellung, Accessibility und Screen Recording) zustimmen. Nach dem Scharfschalten werden Aktionen bis zum Ablauf oder bis zu `/phone disarm` ohne Bestätigung pro Aktion ausgeführt.
- Texteingaben werden graphemweise übermittelt. Abbruch, Verbindungsunterbrechung, Pause, Deaktivierung oder Austausch des Endpunkts stoppen die Eingabe vor dem nächsten Graphem, statt den veralteten Rest weiterlaufen zu lassen.
- Screenshots sind ausschließlich für das Modell bestimmt und werden nie automatisch an den Chat gesendet (Issue [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Behandeln Sie Bildschirminhalte als nicht vertrauenswürdig; sie können Prompt Injection enthalten.

## Verhältnis zu anderen Desktop-Steuerungspfaden

Dies ist der vom Agenten gesteuerte Pfad. Unter [Peekaboo-Bridge](/de/platforms/mac/peekaboo) erfahren Sie, wie er mit dem PeekabooBridge-Host, Codex Computer Use und dem direkten MCP `cua-driver` zusammenhängt.
