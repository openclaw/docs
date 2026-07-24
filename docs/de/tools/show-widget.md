---
read_when:
    - Sie möchten, dass ein Agent ein interaktives Ergebnis im Webchat, in einer nativen App oder in Discord darstellt.
    - Sie möchten, dass Widget-Schaltflächen Folge-Prompts an den Chat senden
    - Sie möchten Widgets mit den gemeinsamen Design-Tokens gestalten
    - Sie benötigen den Vertrag für Eingabe, Sicherheit oder Aufbewahrung von show_widget
sidebarTitle: Show widget
summary: Eigenständige HTML-Widgets auf unterstützten Chat-Oberflächen anzeigen
title: Widget anzeigen
x-i18n:
    generated_at: "2026-07-24T05:24:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 903adff1fadeb9d224d3e2d839c86082b5244e1e319255c8d3f6619344b749a3
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` ist ein Core-Tool, das ein eigenständiges HTML-Widget auf der aktuellen Oberfläche des Benutzers anzeigt. OpenClaw rendert es inline in der Control UI sowie in Quick-Chat-Transkripten unter iOS, Android, macOS und Linux; das Linux-Dashboard verwendet die browserbasierte Control UI. In einer Discord-Sitzung mit aktivierten [Activities](/channels/discord-activities) veröffentlicht das Discord-Plugin eine Schaltfläche **Open widget**, die es als Activity startet.

## Funktionsweise von Widgets

Wenn der Agent `show_widget` aufruft, umschließt der OpenClaw-Core `widget_code` mit einem minimalen HTML-Dokument, speichert es als Canvas-Dokument und gibt ein Vorschau-Handle zurück. Die Control UI rendert dieses Handle in einem Sandbox-iframe, während Quick Chat unter iOS, Android, macOS und Linux isolierte Webviews verwendet. Vollständige Chat-Clients stellen das Widget nach dem erneuten Laden des Verlaufs wieder her; Quick Chat behält das Widget für seine aktive Antwort bei.

In Control-UI-Sitzungen kann ein Canvas-Widget auch an das Sitzungs-Dashboard angeheftet werden. Legen Sie `pin: true` im Tool-Aufruf fest oder verwenden Sie **An Dashboard anheften** bei einem vorhandenen Widget im Transkript. Angeheftetes HTML wird hinter demselben Sandbox-Host mit dediziertem Ursprung und doppeltem iframe ausgeführt, der auch von MCP Apps verwendet wird; der Browser löst eine Widget-Datenbindung niemals innerhalb des nicht vertrauenswürdigen Frames auf.

Für die Einbettung im Browser injiziert das Wrapper-Dokument vier kleine Host-Bridges rund um den Widget-Code:

- Ein Größenmelder übermittelt die Höhe des gerenderten Inhalts an den einbettenden Chat, der sie begrenzt und den iframe entsprechend anpasst (160 bis 1200 Pixel).
- Eine Host-Bridge definiert den veralteten `sendPrompt(text)`-Helper sowie die strukturierten APIs `openclaw.prompt`, `openclaw.state`, `openclaw.data` und `openclaw.cron`. Inline-Chat-Prompts behalten ihren privaten Nachrichtenkanal; Dashboard-APIs verwenden einen an ein Ansichtsticket gebundenen Anfragekanal. Siehe [Interaktive Widgets](#interactive-widgets) und [Dashboard-Funktionen](#dashboard-capabilities).
- Eine Theme-Bridge lauscht auf die aktuellen Design-Tokens der Control UI und wendet sie beim Laden sowie erneut bei jeder Theme-Änderung als CSS-Variablen an.
- Eine Snapshot-Bridge rendert das aktuelle Widget-Dokument als PNG, wenn der einbettende Chat einen Export anfordert.

Alles andere bleibt innerhalb des Frames: Das Dokument wird unter einem opaken Ursprung mit einer strengen Content Security Policy ausgeführt, sodass Widget-Skripte weder auf die Control UI noch auf den Gateway oder das Netzwerk zugreifen können.

Die Core-Implementierung ist nur verfügbar, wenn der ursprüngliche Gateway-Client die Fähigkeit `inline-widgets` deklariert. Die Control UI und unterstützte native Apps deklarieren diese Fähigkeit automatisch. Linux Quick Chat bleibt bei Gateway-Verbindungen, die einen benutzerdefinierten TLS-Leaf-Pin erfordern, auf Text beschränkt, da seine Plattform-WebView diesen Pin nicht binden kann. Die Discord-Implementierung ist nur in Discord-Sitzungen mit konfigurierten Activities verfügbar. Andere Kanalausführungen erhalten `show_widget` nicht.

Der Fähigkeitstransport umfasst eingebettete, Codex-App-Server- und CLI-gestützte Modell-Backends. Durch Grants authentifizierte MCP-Aufrufer und direkte HTTP-Tool-Aufrufer bleiben nach dem Fail-Closed-Prinzip gesperrt, da sie keine Client-Fähigkeiten deklarieren.

## Designsystem

Jedes Canvas-Widget enthält ein klassenloses Basis-Stylesheet und einen kleinen Satz von Tokens:

| Token                                                                                 | Zweck                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| `--surface`                                                                           | Oberflächenfarbe auf Seitenebene      |
| `--card`                                                                              | Hintergrund für Karten, Schaltflächen und Code |
| `--elevated`                                                                          | Hervorgehobener Hintergrund für Formularsteuerelemente |
| `--text`                                                                              | Standardtext für Inhalt und Steuerelemente |
| `--text-strong`                                                                       | Überschriften und hervorgehobene Werte |
| `--muted`                                                                             | Sekundärtext und dezente Rahmen       |
| `--border`                                                                            | Standardtrennlinien und Kartenrahmen  |
| `--border-strong`                                                                     | Kräftige Rahmen für Steuerelemente    |
| `--accent`                                                                            | Links und Fokusringe                  |
| `--accent-fill`                                                                       | Füllung der primären Aktion           |
| `--accent-fg`                                                                         | Text auf einer primären Aktion        |
| `--ok`                                                                                | Erfolgsstatus                         |
| `--warn`                                                                              | Warnstatus                            |
| `--danger`                                                                            | Fehler- oder destruktiver Status      |
| `--info`                                                                              | Informationsstatus                   |
| `--radius`                                                                            | Gemeinsamer Eckenradius für Steuerelemente und Karten |
| `--font-body`                                                                         | Schriftarten-Stack des Host-Inhalts   |
| `--font-mono`                                                                         | Monospace-Schriftarten-Stack des Hosts |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Abgeleitete durchscheinende Statushintergründe |

Unformatierte Überschriften, Absätze, Links, Schaltflächen, Eingabefelder, Auswahlfelder, Textbereiche, Tabellen und Codeblöcke erhalten Basisstile. Hilfsklassen stellen gängige Muster bereit:

- `.card` für eine umrahmte Inhaltsfläche
- `.badge` sowie `.ok`, `.warn`, `.danger` oder `.info` für kompakte Statuskennzeichnungen
- `.metric` für einen hervorgehobenen numerischen Wert
- `.muted` für Sekundärtext
- `.row` für ein umbrechendes horizontales Layout
- `button.primary` für die primäre Aktion

Die Control UI sendet beim Laden eines Widgets und bei jeder Theme-Änderung eine `openclaw:widget-theme`-Nachricht mit den aktiven Theme-Werten. Widgets übernehmen dadurch ohne erneutes Laden jede Theme-Familie, einschließlich Claw, Knot, Dash und benutzerdefinierter Themes. Außerhalb der Control UI, einschließlich nativer Apps und direkter Aufrufe, verwenden Widgets die durch `prefers-color-scheme` ausgewählte integrierte helle oder dunkle Palette.

Erstellen Sie Widgets nach drei Regeln:

1. Verwenden Sie die Designvariablen für jede Farbe und jeden Hintergrund. Codieren Sie keine Farbwerte fest.
2. Halten Sie den Seitenhintergrund transparent, damit sich das Widget in seine Host-Oberfläche einfügt.
3. Reservieren Sie `--accent-fill` für höchstens eine primäre Aktion.

**Export:** Öffnen Sie im Webchat das Menü der Widget-Karte, um das gerenderte Widget in die Zwischenablage zu kopieren oder als PNG herunterzuladen. Ältere Widget-Dokumente ohne Snapshot-Bridge greifen ersatzweise auf den Download einer HTML-Datei zurück.

## Tool verwenden

Beide Implementierungen verwenden dieselben Pflichtfelder:

<ParamField path="title" type="string" required>
  Kurzer Titel, der mit der Inline-Vorschau und im Titel des gehosteten Dokuments angezeigt wird.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Eigenständiges HTML oder SVG. Bei Clients für Inline-Widgets werden Eingaben, die nach dem Entfernen von Leerraum mit `<svg` beginnen, im SVG-Modus gerendert; die maximale Länge beträgt 262.144 Zeichen. Discord akzeptiert ein vollständiges HTML-Dokument oder ein Body-Fragment mit bis zu 48 KiB.
</ParamField>

Discord akzeptiert außerdem optionalen `button_label`-Text für die Startschaltfläche der Activity. Das Canvas-Schema lässt dieses ausschließlich für Discord vorgesehene Feld bewusst aus.

Das Core-Canvas-Tool akzeptiert diese optionalen Felder für die Dashboard-Platzierung:

- `pin`: platziert das Widget zusätzlich auf dem Sitzungs-Dashboard.
- `name`: stabiler Widget-Name; standardmäßig ein Slug von `title`.
- `tab`: Slug des Ziel-Tabs.
- `size`: einer der Werte `sm`, `md`, `lg`, `xl` oder `full`.
- `after`: Name des gleichgeordneten Widgets, hinter dem das Widget platziert werden soll.
- `capabilities`: von einem angehefteten Widget angeforderter Zugriff. `netOrigins` enthält exakte HTTPS-Ursprünge; `tools` enthält `prompt`, eine auf der Positivliste stehende Lesebindung oder eine exakte `cron.trigger:<jobId>`-Aktion.

Das Core-Ergebnis enthält ein Canvas-Vorschau-Handle, sodass die Control UI und unterstützte native Apps das Widget direkt aus dem Tool-Aufruf rendern und es nach dem erneuten Laden des Verlaufs wiederherstellen. Angeheftete Ergebnisse behalten außerdem den Namen des Board-Widgets bei, damit die Control UI nach dem erneuten Laden des Transkripts keine doppelte Anheftung anbietet. Discord gibt die Kennungen des gespeicherten Widgets und der veröffentlichten Nachricht zurück.

`discord_widget` bleibt für eine Release-Version als veralteter Alias registriert. Neue Agent-Aufrufe sollten `show_widget` verwenden.

## Interaktive Widgets

In der Control UI können Widget-Skripte die Konversation steuern. Das Wrapper-Dokument definiert eine globale Funktion `sendPrompt(text)`; ihr Aufruf übermittelt `text` an den Chat, als hätte der Benutzer die Nachricht eingegeben und gesendet. Verknüpfen Sie sie mit Schaltflächen oder anderen Steuerelementen, um interaktive Abläufe wie Auswahlfunktionen, Quizze oder Drill-down-Dashboards zu erstellen. Native Apps rendern interaktiven Widget-Code, stellen diese Chat-Prompt-Bridge jedoch nicht bereit.

```html
<button onclick="sendPrompt('Fehlgeschlagene Tests im Detail anzeigen')">Fehlgeschlagene Tests</button>
```

Jeder Prompt wird auf beiden Seiten der Frame-Grenze validiert:

- `sendPrompt` erfordert eine [vorübergehende Benutzeraktivierung](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) innerhalb des Widgets: Die Funktion arbeitet nur in den wenigen Sekunden, nachdem der Benutzer im Widget geklickt oder eine Taste gedrückt hat. Verknüpfen Sie sie daher mit Schaltflächen und anderen Klickzielen – ein automatischer Aufruf beim Laden bewirkt nichts. Die Bridge hält den sendenden Endpunkt für sich privat und arbeitet in Browsern, die keine Benutzeraktivierung bereitstellen, nach dem Fail-Closed-Prinzip, sodass Widget-Code die Prüfung nicht umgehen kann.
- Die Prompt-Autorität liegt ausschließlich beim ursprünglichen Widget-Dokument. Die vertrauenswürdige Bridge bietet dem Chat ihren Kanalendpunkt an, bevor Widget-Code ausgeführt oder im Frame navigiert werden kann; der Chat übernimmt nur dieses erste Angebot, und der Kanal wird bei einer Navigation zusammen mit dem Dokument beendet. Extern zugelassene Einbettungs-URLs werden niemals übernommen.
- Der Widget-Frame muss im Chat-Transkript sichtbar sein und den Fokus haben – ein zusätzliches vom Host beobachtetes Signal dafür, dass der Benutzer tatsächlich mit diesem Widget interagiert.
- Der Text darf nach dem Entfernen von Leerraum nicht leer sein und höchstens 4.000 Zeichen umfassen.
- Prompts, die mit `/` beginnen, werden abgelehnt, sodass Widget-Code keine Chat-Befehle wie `/approve` oder `/stop` auslösen kann.
- Jedes Widget-Dokument darf höchstens 10 Prompts pro gleitender Minute senden; darüber hinausgehende Prompts werden ohne Meldung verworfen.

Akzeptierte Prompts erscheinen im Transkript als reguläre Benutzernachrichten und starten einen normalen Agent-Durchlauf in der Sitzung, der das Widget zugeordnet ist. Es gibt keinen Rückkanal zum Widget: Ein verworfener Prompt schlägt ohne Meldung fehl, und das Widget kann die Antwort des Agenten nicht lesen.

## Dashboard-Funktionen

Angeheftete Widgets können eine an ein Ticket gebundene Host-API verwenden, nachdem der Operator die auf der ausstehenden Karte angezeigte Deklaration geprüft hat:

- `openclaw.prompt.send(text)` erfordert eine vorübergehende Benutzeraktivierung und veröffentlicht eine sichtbare Nachricht im Eingabefeld. Durch Deklarieren und Empfangen der Tool-Berechtigung `prompt` entfällt die zusätzliche Bestätigung bei jedem Klick; Validierung, Fokusprüfungen und Ratenbegrenzungen gelten weiterhin.
- `openclaw.state.emit(payload)` fügt einen Sitzungshinweis hinzu. Nutzdaten sind auf 8 KiB begrenzt, und identische Client-Übermittlungen innerhalb von fünf Sekunden werden zusammengeführt.
- `openclaw.data.read(bindingId, params?)` wird ausschließlich am Gateway aufgelöst. Gewährbare Bindungen sind `sessions.list`, `usage.status`, `usage.cost`, `cron.list`, `cron.status`, `agents.list` und `health`.
- `openclaw.cron.trigger(jobId)` führt einen vorhandenen Auftrag nur dann sofort aus, wenn exakt die Fähigkeit `cron.trigger:<jobId>` gewährt wurde.

Der Netzwerkzugriff ist von Host-Tools getrennt. Tragen Sie die exakten HTTPS-Ursprünge in `capabilities.netOrigins` ein; nach der Genehmigung werden nur diese Ursprünge in die `connect-src` des Widgets aufgenommen. Platzhalter, Anmeldedaten, Pfade, Abfragezeichenfolgen und nicht deklarierte Ursprünge bleiben blockiert. Ein expliziter Port ist nur zulässig, wenn er Teil des deklarierten Ursprungs ist.

## Sicherheit und Speicherung

Widget-Dokumente verwenden restriktive Content Security Policies. Inline-Stile und -Skripte sind zulässig, während das Laden externer Ressourcen blockiert bleibt. Inline-Transkript-Widgets können nicht auf das Netzwerk zugreifen. Ein angeheftetes Dashboard-Widget kann nur exakte HTTPS-Ursprünge abrufen, die der Agent deklariert und der Betreiber gewährt hat.

Beim iframe der Control UI wird `allow-same-origin` immer weggelassen, selbst wenn der globale Einbettungsmodus `trusted` ist, sodass Widget-Skripte den Ursprung der übergeordneten Anwendung nicht lesen können. Native Clients verwenden isolierte, nicht persistente Webansichten und blockieren die Navigation vom gehosteten Widget weg. Der zentrale Dokument-Host stellt Widgets außerdem mit einem `Content-Security-Policy: sandbox allow-scripts`-Antwortheader bereit, sodass das Widget selbst bei direkter Darstellung in einem undurchsichtigen Ursprung statt in einem Anwendungsursprung ausgeführt wird. Stellen Sie nur Widget-Code dar, den Sie in diesem isolierten Frame auszuführen bereit sind.

Der iframe folgt außerdem [`gateway.controlUi.embedSandbox`](/de/web/control-ui#hosted-embeds). Die standardmäßige Stufe `scripts` unterstützt interaktive Widgets und bewahrt zugleich die Ursprungsisolation.

Das akzeptierte Restrisiko ausgehender WebRTC-Datenkanäle ist unter [Dashboard-Architektur](/web/dashboard-architecture#modeled-residual-webrtc-data-channels) dokumentiert.

Canvas behält höchstens 32 Widgets pro Sitzung bei (oder pro Agent, wenn keine Sitzung verfügbar ist). Beim Erstellen eines weiteren Widgets wird das älteste Dokument in diesem Geltungsbereich entfernt.

## Verwandte Themen

- [Gehostete Einbettungen der Control UI](/de/web/control-ui#hosted-embeds)
- [Discord-Aktivitäten](/channels/discord-activities)
- [Canvas-Node-Steuerelemente](/de/plugins/reference/canvas)
- [Client-Fähigkeiten des Gateway-Protokolls](/de/gateway/protocol#client-capabilities)
