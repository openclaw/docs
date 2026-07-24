---
read_when:
    - Dem Gateway-Agenten ermöglichen, einen gekoppelten Desktop zu sehen und zu steuern
    - Aktivierung, Berechtigungen oder Sicherheit bei der Computernutzung
    - Erweitern des Node-Befehls computer.act oder seiner Ausführungsimplementierungen
summary: Fähigkeitsbasierte Desktopsteuerung über das Computer-Tool und den Node-Befehl `computer.act`
title: Computernutzung
x-i18n:
    generated_at: "2026-07-24T03:58:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df8ce87e607ce1b22d91e4ed8702d500bccd4d4f59dab7b0eafac565e730d48a
    source_path: nodes/computer-use.md
    workflow: 16
---

Mit der Computersteuerung kann der Gateway-Agent einen leistungsfähigen gekoppelten Desktop sehen und steuern. Die Eignung basiert auf Funktionen: Die verbundene Node muss sowohl `computer.act` als auch `screen.snapshot` ankündigen, wobei das Ergebnis von Letzterem ein `displayFrameId` enthalten muss. Das Tool erfasst einen Screenshot als Referenzbild und steuert anschließend Zeiger und Tastatur über den gefährlichen Befehl `computer.act`. Der Aktionssatz entspricht den zentralen Computer-Use-Aktionen von Anthropic; der optionale Zoom `computer_20251124` wird nicht bereitgestellt. Ein visionsfähiges Modell steuert die Funktion über das integrierte Agent-Tool `computer`.

Der Agent gibt einen einheitlichen Befehl aus, `computer.act`; er kann nicht erkennen, wie eine Node ihn ausführt. Die mitgelieferte macOS-App verarbeitet den Befehl prozessintern mit eingebetteten Peekaboo-Diensten und gezielt eingesetzten CoreGraphics-Primitiven (korrekte TCC-Berechtigungen, kein zusätzlicher Prozess). Windows und Linux können das optionale, experimentelle Plugin `cua-computer` mit einer separat installierten Binärdatei `cua-driver` verwenden. Beide Implementierungen verwenden dieselben Richtlinien für Kopplung und Aktivierung.

## Anforderungen

- Eine gekoppelte, verbundene Node, die sowohl `computer.act` als auch `screen.snapshot` ankündigt, wobei `screen.snapshot` den Wert `displayFrameId` zurückgibt.
- **macOS-Implementierung:** App-Einstellung **Allow Computer Control** aktiviert (Standard: aus).
- **macOS-Implementierung:** OpenClaw wurde die Berechtigung **Accessibility** (für die Zeiger-/Tastatureingabe) sowie die Berechtigung **Screen Recording** (für `screen.snapshot`) erteilt.
- **Windows-/Linux-Implementierung:** Mitgeliefertes Plugin `cua-computer` aktiviert und eine kompatible ausführbare Datei `cua-driver` der Version 0.10.x installiert.
- Der Befehl `computer.act` ist auf dem Gateway aktiviert (er ist gefährlich und standardmäßig deaktiviert).
- Ein visionsfähiges Agent-Modell.
- Eine Tool-Richtlinie, die `computer` bereitstellt. Das standardmäßige Profil `coding` tut dies nicht. Fügen Sie `computer` zu `tools.alsoAllow` hinzu; Sandbox-Agenten benötigen es außerdem in `tools.sandbox.tools.alsoAllow`.

## Das Agent-Tool `computer`

Das integrierte Tool `computer` führt pro Aufruf eine Aktion aus. Koordinaten sind nicht negative ganzzahlige Pixelwerte im neuesten Screenshot; die Node ordnet sie Anzeigepunkten zu. Koordinatenaktionen müssen den Wert `frameId` aus dem Screenshot-Ergebnis wiederholen, und ein expliziter Wert `screenIndex` muss mit diesem Bild übereinstimmen. OpenClaw überträgt außerdem eine von der Node ausgegebene Anzeigeidentität aus dem Screenshot in die Aktion, sodass eine erneute Verbindung der Anzeige oder eine Geometrieänderung sicher fehlschlägt, statt unbemerkt denselben Index auf ein anderes Ziel umzuleiten. Diese Prüfungen lehnen erratene Token sowie Token aus einem anderen übermittelten Bild oder von einer anderen Anzeige ab. Ein Token garantiert keine Aktualität: Apps können die Pixel auf derselben Anzeige nach der Erfassung ändern. Erstellen Sie daher einen neuen Screenshot, sobald sich die Ansicht geändert haben könnte.

- Lesen: `screenshot`.
- Zeiger: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (mit `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Scrollen: `scroll` mit `scrollDirection` (`up|down|left|right`) und `scrollAmount` (Mausradschritte).
- Tastatur: `type` (Text), `key` (Kombination wie `cmd+shift+t` oder `Return`), `hold_key` (Kombination `text` wird `duration` Sekunden lang gehalten).
- Zeitsteuerung: `wait` (`duration` Sekunden).

Modifikatortasten werden über das Feld `text` für Klick- und Scrollaktionen übermittelt (`shift`, `ctrl`, `alt`, `cmd`). Nach einer Eingabeaktion gibt das Tool einen neuen Screenshot zurück, damit das Modell das Ergebnis beobachten kann. Wenn mehr als eine computerfähige Node verbunden ist, geben Sie `node` ausdrücklich an.

Screenshots bleiben **ausschließlich für das Modell bestimmt**: Sie werden niemals automatisch an den Chat-Kanal übermittelt. Behandeln Sie sämtliche Bildschirminhalte als nicht vertrauenswürdige Eingaben; das Tool weist das Modell darauf hin, keine Bildschirmanweisungen zu befolgen, die der Anfrage des Benutzers widersprechen.

## Windows und Linux (experimentell, über cua-driver)

Das mitgelieferte Plugin `cua-computer` stellt eine experimentelle Implementierung für Windows- und Linux-Node-Hosts bereit. Es ist standardmäßig deaktiviert und erfordert den Vorabversions-Treibervertrag 0.10.x:

1. Installieren Sie eine Binärdatei `cua-driver` der Version 0.10.x aus den [Upstream-Releases](https://github.com/trycua/cua/releases) und stellen Sie sie über `PATH` bereit. Um einen anderen Speicherort der ausführbaren Datei zu verwenden, setzen Sie `plugins.entries.cua-computer.config.driverPath`.
2. Aktivieren Sie das Plugin:

   ```bash
   openclaw plugins enable cua-computer
   ```

3. Starten Sie `openclaw node run` aus der interaktiven Desktop-Sitzung. Das Plugin startet den lokalen Treiber-Daemon verzögert, sobald die erste Erfassung oder Aktion eingeht.

Diese Implementierung steuert derzeit nur die primäre Anzeige. X11/XWayland ist unter Linux der bevorzugte Pfad. Natives Wayland bleibt eine Upstream-Opt-in-Funktion: Setzen Sie `CUA_DRIVER_RS_ENABLE_WAYLAND` selbst, bevor Sie die Node starten; OpenClaw setzt die Variable niemals automatisch. KDE/KWin wird vom nativen Wayland-Eingabepfad des Upstream-Projekts nicht unterstützt. `hold_key`, `left_mouse_down` und `left_mouse_up` sind nicht verfügbar, da cua-driver 0.10.x keinen plattformübergreifenden Vertrag für gehaltene Eingaben auf Desktop-Ebene besitzt. Scrollen und Ziehen bei gehaltener Modifikatortaste sind auf beiden Plattformen nicht verfügbar; Klicks bei gehaltener Modifikatortaste sind unter Linux ebenfalls nicht verfügbar. Die Aktion `key` akzeptiert benannte Tasten, Buchstaben und Modifikatortastenkombinationen (beispielsweise `cmd+c` oder `Return`); Ziffern- und Satzzeichentasten werden abgelehnt, da der Treiber ihren layoutabhängigen Umschaltzustand verwirft. Senden Sie solchen Text stattdessen über die Aktion `type`. Die Texteingabe kann während eines Treiberaufrufs von `type_text` nicht vorzeitig abgebrochen werden.

Da cua-driver keine stabile Anzeigeidentität meldet, wird die Bildautorisierung an die Treiberverbindung sowie die aktuelle Geometrie der primären Anzeige gebunden. Eine erneute Verbindung des Daemons oder der Sitzung macht ausstehende Bilder ungültig. Der Austausch der primären Anzeige durch eine Anzeige mit identischer Geometrie kann jedoch nicht erkannt werden, wenn die Verbindung geöffnet bleibt; verwenden Sie für diese Implementierung vorzugsweise eine stabile Sitzung mit nur einer Anzeige.

OpenClaw deaktiviert Telemetrie und Aktualisierungsprüfungen von cua-driver für die verwalteten Prozesse `mcp` und `serve`. Die Treiber-Binärdatei wird weder heruntergeladen noch aktualisiert.

### Fehlerbehebung

Die Implementierung `cua-computer` gibt typisierte Fehlercodes im Tool-Ergebnis und in den Node-Protokollen aus. Häufige Fehler:

| Code                                                 | Ursache                                                                                                                                                           | Behebung                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `COMPUTER_DRIVER_UNAVAILABLE`                        | Die Binärdatei `cua-driver` befindet sich nicht in `PATH` (oder `driverPath` ist falsch), der Daemon wurde nicht rechtzeitig bereit oder die Node verwendet weder Windows noch Linux.                 | Installieren Sie `cua-driver` 0.10.x in `PATH` oder setzen Sie `driverPath`. Führen Sie `openclaw node run` innerhalb der interaktiven Desktop-Sitzung aus; stellen Sie unter Linux sicher, dass ein X11-`DISPLAY` (oder ein `WAYLAND_DISPLAY` mit `CUA_DRIVER_RS_ENABLE_WAYLAND`) vorhanden ist. |
| `COMPUTER_DRIVER_UNSUPPORTED`                        | Der verbundene Treiber ist nicht `cua-driver` 0.10.x oder seine Funktions-/Schemaversion weicht ab.                                                                      | Installieren Sie einen unterstützten 0.10.x-Build. Das Plugin führt etwa 30 Sekunden nach der Korrektur eine erneute Prüfung durch, sodass kein Neustart der Node erforderlich ist.                                                                                                          |
| `COMPUTER_REFUSED_<code>`                            | Der Treiber hat die Aktion mit einem strukturierten Code wie `background_unavailable`, `background_occluded` oder `foreground_unavailable` (KDE/KWin Wayland) abgelehnt.   | Bringen Sie das Zielfenster in den Vordergrund, wechseln Sie zu X11 oder verwenden Sie einen unterstützten Compositor. Beachten Sie die Kompatibilitätshinweise weiter oben.                                                                                                                    |
| `COMPUTER_STALE_FRAME`                               | Die Koordinaten bezogen sich auf einen Screenshot, der nicht mehr aktuell ist (Kontext-Compaction, Änderung der Anzeigegeometrie oder Änderung der Referenzbreite).                 | Erstellen Sie vor der Koordinatenaktion einen neuen `screenshot`.                                                                                                                                                                              |
| `COMPUTER_UNSUPPORTED_ACTION`                        | Eine Aktion, die diese Implementierung nicht zuverlässig ausführen kann: `hold_key`, `left_mouse_down`, `left_mouse_up`, Ziehen/Scrollen mit gehaltener Modifikatortaste oder Klicks mit gehaltener Modifikatortaste unter Linux. | Verwenden Sie eine unterstützte Aktion. cua-driver 0.10.x besitzt keinen Vertrag für gehaltene Eingaben auf Desktop-Ebene.                                                                                                                                                  |
| `COMPUTER_UNSUPPORTED_DISPLAY`                       | Ein nicht primärer Wert `screenIndex`, eine Abweichung zwischen Erfassungs- und Bildschirmgeometrie oder ein Cursor außerhalb der primären Anzeige.                                                       | Steuern Sie ausschließlich die primäre Anzeige.                                                                                                                                                                                                      |
| `COMPUTER_UNSUPPORTED_KEY`                           | Ein Wert `key`, den der Treiber nicht zuverlässig reproduzieren kann: eine Ziffern- oder Satzzeichentaste mit layoutabhängigem Umschaltzustand oder eine unbekannte Taste.                        | Senden Sie diesen Text stattdessen über die Aktion `type`.                                                                                                                                                                                    |
| `COMPUTER_DRIVER_ERROR` / `COMPUTER_INVALID_REQUEST` | Der Treiber ist ohne strukturierten Code fehlgeschlagen oder die Aktionsargumente waren fehlerhaft.                                                                            | Prüfen Sie den Treiberstatus und erstellen Sie erneut einen Screenshot; korrigieren Sie die Aktionsargumente.                                                                                                                                                        |

## Der Node-Befehl `computer.act`

`computer.act` ist der einzelne Node-Befehl, über den das Tool Eingaben weiterleitet (`node.invoke` mit `command: "computer.act"`). Er ist:

- **Standardmäßig gefährlich**: Er ist in den integrierten gefährlichen Node-Befehlen aufgeführt und von der Laufzeit-Zulassungsliste ausgeschlossen, bis er ausdrücklich aktiviert wird. macOS-, Windows- und Linux-Desktop-Nodes können ihn dennoch bei der Kopplung deklarieren, sodass die Schnittstelle einmalig genehmigt wird.
- **Funktionsbasiert**: Das Tool setzt voraus, dass eine verbundene Node sowohl `computer.act` als auch `screen.snapshot` ankündigt. Die mitgelieferte macOS-App und das optionale experimentelle Plugin `cua-computer` führen dasselbe Befehlspaar aus.

Lesevorgänge verwenden `screen.snapshot` erneut; es gibt keinen zweiten Erfassungspfad. Weitere Informationen zum gemeinsamen Erfassungsbefehl finden Sie unter [Kamera- und Bildschirm-Nodes](/de/nodes/camera).

## Aktivieren und scharfschalten

1. Aktivieren Sie den Plattform-Ausführer: Aktivieren Sie unter macOS **Settings → Allow Computer Control** und gewähren Sie anschließend unter **Settings → Permissions** die Berechtigungen **Accessibility** und **Screen Recording**; folgen Sie unter Windows/Linux der oben beschriebenen experimentellen Einrichtung für `cua-computer`.
2. Genehmigen Sie die Kopplungsaktualisierung auf dem Gateway (ein neuer Befehl erzwingt eine erneute Kopplung).
3. Stellen Sie das Tool dem visuell befähigten Agenten zur Verfügung. Für das standardmäßige Profil `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Sandboxed-Agenten benötigen auch diese zweite Freigabe:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Schalten Sie `computer.act` für ein begrenztes Zeitfenster scharf. Das Plugin `phone-control` stellt eine Gruppe `computer` bereit:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Das Scharfschalten erfordert `operator.admin` (oder den Eigentümer) und läuft automatisch ab. Die ältere Gruppe `/phone arm all` schließt die Desktop-Steuerung absichtlich aus; verwenden Sie die ausdrückliche Gruppe `computer`. Das Scharfschalten legt lediglich fest, was das Gateway aufrufen darf; die Node-App erzwingt weiterhin ihre plattformspezifischen Einstellungen und Betriebssystemberechtigungen, einschließlich **Allow Computer Control**, Accessibility und Screen Recording unter macOS.

Fügen Sie für eine dauerhafte Autorisierung `computer.act` zu `gateway.nodes.commands.allow` hinzu **und entfernen Sie es aus** `gateway.nodes.commands.deny`; die Sperrliste hat Vorrang. Eine dauerhafte Autorisierung läuft nicht automatisch ab. Einträge, die bereits vor `/phone arm` vorhanden waren, bleiben nach `/phone disarm` erhalten; wandeln Sie eine temporäre Gewährung nicht in eine dauerhafte um, während sie scharfgeschaltet ist.

Die Autorisierung ist bewusst in Aktivierung und Verwendung unterteilt. Das Scharfschalten oder
die dauerhafte Konfiguration von `computer.act` erfordert Administratorberechtigungen.
Nach dem Scharfschalten kann ein authentifizierter Operator mit `operator.write`
`computer.act` über `node.invoke` aufrufen, bis die Gewährung abläuft oder aufgehoben wird;
es gibt keine Administratorprüfung für einzelne Aktionen. Die Genehmigung einer Node, die
`computer.act` deklariert, registriert lediglich die Oberfläche, damit sie später scharfgeschaltet werden kann, und
ermöglicht für sich allein keinen Aufruf.

## Sicherheit

- Vor der Autorisierung müssen alle Ebenen (Tool-Richtlinie, Gateway-Befehlsrichtlinie, Einstellung der Node-App und Plattformberechtigungen) übereinstimmen. Beim aktuellen macOS-Ausführer gehören dazu **Allow Computer Control**, Accessibility und Screen Recording. Nach dem Scharfschalten werden Aktionen bis zum Ablauf oder bis `/phone disarm` ohne Bestätigung für einzelne Aktionen ausgeführt.
- Der macOS-Ausführer übermittelt Text graphemweise, sodass ein Abbruch, eine Trennung, eine Pause, eine Deaktivierung oder ein Austausch des Endpunkts die Übermittlung vor dem nächsten Graphem stoppt. Der experimentelle cua-driver-Ausführer kann einen Aufruf von `type_text` während der Texteingabe nicht abbrechen.
- Screenshots sind ausschließlich für das Modell bestimmt und werden niemals automatisch an den Chat gesendet (Issue [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Behandeln Sie Bildschirminhalte als nicht vertrauenswürdig; sie können Prompt-Injection enthalten.

## Beziehung zu anderen Pfaden für die Desktop-Steuerung

Dies ist der agentengesteuerte Pfad. Unter [Peekaboo-Bridge](/de/platforms/mac/peekaboo) wird erläutert, wie er mit dem PeekabooBridge-Host, Codex Computer Use und dem direkten MCP `cua-driver` zusammenhängt.
