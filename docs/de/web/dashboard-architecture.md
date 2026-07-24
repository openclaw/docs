---
read_when:
    - Implementieren oder Überprüfen der Sitzungs-Dashboard-Funktion (Boards)
    - Ändern des Widget-Hostings, der Widget-Bridge oder des Board-Speichers
summary: 'Sitzungs-Dashboards: Architektur und Implementierungsplan (technischer Entwurf, vor GA)'
title: Dashboard-Architektur
x-i18n:
    generated_at: "2026-07-24T05:22:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7c5da94ec19add55c6b7b530f0c17509a027e97fb301469ce48f520b325c169
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Technisches Designdokument für die Sitzungs-Dashboard-Funktion, verfasst vor und
während der Implementierung. Es ist die maßgebliche Quelle für den Ausbau. Sobald die
Funktion ausgeliefert wird, wird `/web/dashboard` zur benutzerorientierten Seite, während diese Seite
als Architekturreferenz bestehen bleibt.
</Note>

## Vision

Die Arbeit mit einem Agenten ist heute ein Textstrom. Das Dashboard macht daraus eine
Werkbank: Der Agent rendert interaktive Live-Widgets; der Benutzer heftet sie an
eine persistente Oberfläche; der Chat wird seitlich angedockt (oder ausgeblendet), und der Hauptinhalt ist
das Board. Sie wechseln vom „Sprechen mit dem Agenten“ zum „Bedienen eines Bedienfelds, das der
Agent für Sie erstellt hat“, ohne die Sitzung jemals zu verlassen.

Grundsätze:

- **Ein Board ist eine Ansicht einer Sitzung, kein neues Objekt.** Jede Sitzung (Thread)
  hat zwei Ansichten: das Transkript und das Board. Eine Sitzung ohne angeheftete Widgets
  ist ein einfacher Chat. Heften Sie ein Widget an, und das Board existiert. Boards übernehmen die
  Identität, Agentenzugehörigkeit, Benennung, Anheftung und den Lebenszyklus der Sitzung. Es gibt
  kein `dashboard_create`, keine Board-Registry und kein separates ACL-Modell.
- **Gleichwertigkeit des Agenten.** Alles, was der Benutzer auf einem Board tun kann, kann der Agent
  mit Tools tun: Widgets hinzufügen/aktualisieren/entfernen, sie anordnen, Tabs verwalten, den
  sichtbaren Tab wechseln sowie den Chat andocken oder ausblenden.
- **Nativ, nicht eingebettet.** Das Board besteht aus Lit-Komponenten in der Control-UI-Shell
  (demselben Designsystem wie der Rest der App). Nur der _Inhalt_ eines Widgets wird
  in iframes isoliert. Keine URL-Leiste, keine Browser-Bedienelemente.
- **Kleine Agentenoberfläche.** Widgets werden über einen stabilen Namen adressiert und
  direkt aktualisiert. Das Layout ist ein fließendes, automatisch verdichtendes Raster; der Agent gibt Größen und
  Verankerungen an, niemals Pixel oder Koordinaten.
- **Berechtigungen statt Vertrauen.** Widget-Code ist beliebiges, vom Agenten verfasstes HTML/JS
  in einer strikt isolierten Sandbox. Zugriff (Gateway-Daten, Aktionen, Netzwerk) besteht nur über
  ein deklariertes, vom Betreiber gewährtes Berechtigungsmanifest.

## Konzepte

| Konzept             | Definition                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sitzung (Thread)    | Bestehende Gateway-Sitzung, identifiziert durch den stabilen `sessionKey`. Gehört einem Agenten.                                                                                        |
| Board               | Die Widget-Ansicht einer Sitzung. Existiert genau dann, wenn die Sitzung Widgets/Tabs hat. Übersteht `/new`/`/reset` (an `sessionKey` gebunden, nicht an das Transkript).                 |
| Tab                 | Eine Präsentationsseite eines Boards: welche Widgets, deren Anordnung und der Andockstatus des Chats (`left`/`right`/`bottom`/`hidden`). Boards beginnen mit einem impliziten Tab. |
| Widget              | Benanntes, isoliertes HTML/JS-Programm, das der Sitzung gehört. Adressiert als `sessionKey` + `name`. Wird anhand des Namens direkt aktualisiert.                                              |
| Berechtigungsmanifest | Widget-spezifische Deklaration des Zugriffs: `data` (Lesebindungen), `actions` (Verben auf der Positivliste), `prompt` (an Sitzung senden), `net` (zulässige Ursprünge).                      |
| Anheften (Widget)        | Verschieben eines Transkript-Widgets auf das Board der Sitzung (Benutzerfunktion oder Agenten-Tool-Argument). Durch Lösen wird es vom Board entfernt.                                         |
| Anheften (Sitzung)       | Bestehendes Anheften von Sitzungen in der Seitenleiste. Eine angeheftete Sitzung mit einem Board wird in ihrer Board-Ansicht geöffnet.                                                                      |

## UX-Abläufe

- **Übernahme:** Der Agent ruft `show_widget` in einem beliebigen Chat auf → das Widget wird wie
  heute direkt im Transkript gerendert → beim Darüberfahren erscheint **An Dashboard anheften** → das Widget
  erscheint auf dem Board der Sitzung. Der Agent kann `pin: true` übergeben, um dasselbe zu bewirken.
- **Board-Ansicht:** Eine Sitzung mit einem Board erhält einen Ansichtsumschalter (Chat / Dashboard).
  Board-Ansicht = Tableiste (nur bei >1 Tab) + fließendes Raster + angedockter Chatbereich.
  Die Chat-Andockposition ist größenveränderbar, verschiebbar (links/rechts/unten) und genau
  wie die Seitenleiste einklappbar. Der Andockstatus wird pro Tab gespeichert.
- **Ziehen:** Der Benutzer zieht Widgets; das Raster verdichtet sich automatisch (Widgets rücken nach oben,
  benachbarte fließen neu um). Die Größenänderung über den Griff rastet in Größenstufen ein. Keine pixelgenaue Platzierung —
  für niemanden.
- **Warnung beim Zurücksetzen:** `/new` / `/reset` fordert bei einer Sitzung mit Board
  in der Web-UI eine Bestätigung an („Der Kontext wird zurückgesetzt, das Dashboard bleibt erhalten“) und behält
  das Board bei.
- **Seitenleiste:** Angeheftete Sitzungen zeigen ihre Board-Ansicht, sofern vorhanden.
  Das Board der Home-Sitzung ist das standardmäßige „Agenten-Dashboard“.
- **Interaktionen** (drei Stufen, siehe unten): stille Zustandsereignisse, sichtbares
  Senden von Prompts und Automatisierungsauslöser.

## Interaktionsstufen

1. **Zustandsereignisse (Standard).** Interaktionen mit der Widget-UI, über die das Modell
   informiert sein soll, auf die es jedoch nicht antworten soll. `bridge.emitState({...})` fügt einen strukturierten
   Sitzungshinweis hinzu (derselbe Mechanismus wie bei Gruppenaktivitätshinweisen). Es wird kein Agentendurchlauf
   gestartet; das Modell sieht die gesammelten Hinweise bei seinem nächsten Durchlauf.
2. **Prompts (explizite Kommunikation).** `bridge.sendPrompt(text)` — erfordert eine
   Benutzeraktion; sendet eine sichtbare Benutzernachricht an die Sitzung (der angedockte Chat
   zeigt sie an). Ratenbegrenzt; jedes Senden wird vom Benutzer bestätigt, sofern das Widget nicht über
   die gewährte Berechtigung `prompt` verfügt.
3. **Automatisierung.** `bridge.runAction(name, args)` — löst eine im Manifest deklarierte
   Aktion aus. Anfänglicher Satz von Verben: `cron.trigger` (einen vorhandenen Cron-Auftrag jetzt ausführen) und
   `binding.refresh`. Cron-Aufträge werden bereits in sichtbaren, isolierten Ausführungssitzungen
   ausgeführt und können ein günstigeres Modell verwenden: Dies ist der Pfad „Ein kleines Modell versorgt das Widget“.
   Nirgendwo gibt es verborgene Sitzungen.

## Widget-Modell und Hosting

Widget-HTML/JS wird vom Agenten verfasst (üblicherweise über `show_widget`), in
die standardmäßige Dokument-Shell eingebettet (CSP-Meta, Größenmelder, Bridge-Bootstrap) und
in `<iframe sandbox="allow-scripts">` gerendert (niemals `allow-same-origin`).

- **Inline-Widgets (Transkript)** behalten die aktuelle Canvas-Dokument-Pipeline bei:
  unter dem Zustandsverzeichnis geschrieben, vom Gateway bereitgestellt, pro Geltungsbereich bereinigt, keine
  Genehmigung (sie haben konstruktionsbedingt keine Berechtigungen — das Senden von Prompts wird vom Benutzer bestätigt).
- **Board-Widgets** sind Sitzungszustand: Die Bytes befinden sich in der SQLite-
  DB des zuständigen Agenten (`board_widgets`) und werden über eine zentrale Gateway-Route
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) bereitgestellt, die aus der DB liest.
  Beim Anheften eines Transkript-Widgets werden die Bytes kopiert. Obergrenzen: 256 KB pro Widget,
  48 Widgets pro Board.
- **Direkte Aktualisierung:** Das erneute Ausgeben eines Widgets mit demselben `name` ersetzt die
  Bytes, erhöht `revision`, sendet `board.changed`, und aktive Ansichten laden
  nur dieses iframe neu.
- **Byte-Bindung:** Gewährte Berechtigungen werden an den sha256-Wert der Widget-
  Bytes gebunden. Bei geänderten Bytes bleiben die Berechtigungen `data`/`net`/`actions` nur erhalten, wenn die neue
  Revision eine Teilmenge des gewährten Manifests deklariert; ein erweitertes Manifest
  fordert den Betreiber erneut zur Bestätigung auf.

### Widgets hosten Inhalte; MCP-Apps sind eine Inhaltsart

Das **Widget ist das OpenClaw-Grundelement**: die benannte, angeheftete, dimensionierte,
sitzungseigene Board-Zelle mit einem Berechtigungsdatensatz. Was darin gerendert wird, ist eine
Inhaltsart:

- `html` — vom Agenten über `show_widget` verfasst, Bytes im Board-Speicher.
- `mcp-app` — eine MCP-App-Ansicht eines Drittanbieters (`ui://`-Ressource eines konfigurierten
  Servers), die innerhalb der Widget-Zelle gehostet wird.

MCP-Apps definieren nicht das Widget-Modell; Widgets haben die Fähigkeit erhalten, sie zu
hosten. Identität, Platzierung, Anheftung, Berechtigungen und die Autoren-API bleiben
Eigentum von OpenClaw — dadurch bleibt `show_widget`-Code so kurz wie heute und muss
nie wissen, dass die MCP-Apps-Spezifikation existiert.

Gemeinsam genutzte Infrastruktur darunter (hier greift die Vereinfachung):

- **Ein Sandbox-Host.** `html`-Widgets werden über dieselbe gehärtete
  Pipeline gerendert, mit der MCP-Apps ausgeliefert wurden (doppeltes iframe auf dem dedizierten Sandbox-
  Ursprung, pro Widget deklarierte und fehlschließend dekodierte CSP), statt über einen zweiten
  maßgeschneiderten iframe-Host. Der Proxy empfängt HTML als Wert, daher sind lokale Inhalte
  der natürliche Fall.
- **Ein Autorisierungsmodell.** Der Zugriff eines Widgets ist eine gewährte Positivliste,
  unabhängig von seiner Art: für `html`-Widgets Host-Tools; für `mcp-app`-Widgets
  die für Apps sichtbaren Tools des Servers (über den bestehenden `allowedAppToolNames`-
  Mechanismus, der pro Widget statt pro Erzeugungsdurchlauf dauerhaft gemacht wird).
- **Host-Tools für `html`-Widgets** (über die Widget-Bridge verfügbar gemacht und
  anhand der Berechtigung geprüft):
  - `openclaw.prompt.send` — Stufe 2; über den sichtbaren Editor geleitet,
    vom Benutzer bestätigt, sofern nicht gewährt
  - `openclaw.state.emit` — Sitzungshinweise der Stufe 1 (zusammengefasst, größenbegrenzt)
  - `openclaw.data.read` — parametrisierte schreibgeschützte Bindungen (bestehender
    Satz zulässiger Lese-RPCs), Gateway-seitig aufgelöst
  - `openclaw.cron.trigger` — Automatisierung der Stufe 3
- **`net` = CSP.** Der Netzwerkzugriff verwendet die bereits ausgelieferte CSP-
  Deklaration pro Widget (`connect-src`-Ursprünge) — das selbstaktualisierende Wetter-Widget
  ruft seine API direkt aus der Sandbox ab, ohne Beteiligung des Gateways.
- **Berechtigungen.** Ein Widget, das nichts deklariert, wird sofort gerendert (isoliert,
  `default-src 'none'`, Prompt-Sendevorgänge werden einzeln bestätigt) — dasselbe Vertrauen wie bei den
  heutigen Inline-Chat-Widgets. Deklarierte Tools/Ursprünge versetzen das Widget auf dem Board in
  `pending`: Eine Platzhalterkarte listet sie verständlich auf und bietet **Zulassen**/**Ablehnen**
  mit einem Tippen. Berechtigungen gelten pro Widget-Name; bei `html`-Widgets
  sind sie an die Bytes gebunden (sha256), und geänderte Bytes behalten die Berechtigung nur, wenn die
  Deklaration eingeschränkt wurde.
- **Autoren-Adapter.** Der Dokument-Wrapper injiziert `window.openclaw.prompt`,
  `window.openclaw.state`, `window.openclaw.data` und `window.openclaw.cron`
  als stabile Autoren-API. Dashboard-Aufrufe nutzen gemeinsam einen einzigen, an das Ansichtsticket gebundenen
  Anfragekanal; Größenmeldungen und Theme-Token bleiben separate Host-
  Benachrichtigungen.

### Plugin-Berechtigungsdeklarationen

Aktivierte Plugins können den Widget-Host über `dashboard.dataBindings`
und `dashboard.actionVerbs` in `openclaw.plugin.json` erweitern. Plugin-lokale IDs werden zu
Berechtigungsnamen mit vorangestellter Plugin-ID, etwa `workboard.cards.list` und
`workboard.dispatch`; `%` und `.` werden im Plugin-ID-Segment maskiert, damit eine
andere Aufteilung aus Plugin-/lokaler ID nicht dieselbe persistierte Berechtigung übernehmen kann. Während
der Plugin-Registrierung überprüft OpenClaw, dass jede Bindung auf einen RPC verweist,
der vom selben Plugin mit `operator.read` registriert wurde, und jede Aktion auf einen
mit `operator.write`; ungültige Deklarationen führen dazu, dass das Plugin nicht geladen wird. Die validierte
Registry wird nur bei Änderungen des Plugin-Lebenszyklus neu erstellt, während Widget-Berechtigungen
weiterhin pro Widget sowie an Bytes und Revision gebunden bleiben.

### Modelliertes Restrisiko: WebRTC-Datenkanäle

Die Sandbox-CSP gibt die vorgeschlagene `webrtc 'block'`-Direktive aus, aber
[Chromiums aktueller Satz von CSP-Direktiven](https://chromium.googlesource.com/chromium/src/+/main/services/network/public/mojom/content_security_policy.mojom#95)
implementiert sie nicht. Skriptfähige Widgets können daher in der aktuellen Chromium-Version WebRTC-
Datenkanäle zur Datenübertragung nach außen verwenden. Dasselbe Restrisiko besteht bereits bei
Inline-Chat-Widgets und dem MCP-Apps-Host auf `main`.

**Akzeptierter Kompromiss:** OpenClaw sperrt skriptfähige Widgets nicht aufgrund dieses
Restrisikos. Widget-Inhalte erhalten nur über eine vom Operator gewährte,
byte-fixierte `data:read`-Capability Zugriff auf sensible OpenClaw-Daten, und die
Permissions Policy der Sandbox blockiert den Zugriff auf Kamera und Mikrofon. Eine
DOM-API-Schutzmaßnahme ist eine Best-Effort-Defense-in-Depth, keine Sicherheitsgrenze,
und gehört in eine nachgelagerte Härtungsmaßnahme.

### Transkriptanzeige: eine Widget-Karte

Die Inline-Anzeige wird auf das Widget-Primitiv vereinheitlicht. Wenn ein Tool-Ergebnis UI enthält —
`show_widget`-Ausgabe oder ein MCP-Tool-Ergebnis mit einer App-Ressource — materialisiert das
System ein **flüchtiges, automatisch benanntes Widget** (sitzungsgebunden, bereinigt), und
das Transkript rendert eine einzelne Widget-Karte, die nach Inhaltsart verzweigt.
Die automatische Anzeige von MCP-Apps bleibt exakt so, wie es die Spezifikation erwartet (keine zusätzliche Modellarbeit);
sie _ist_ darunter einfach ein Widget. Dadurch werden die parallelen `mcpApp`-
Sonderfälle beim Chat-Rendering (Oberflächen-Gating, separate Deduplizierung) entfernt, jede
Inline-UI erhält dieselbe Anheftoption, und die Widget-Registry wird zum primären
Pfad für das erneute Öffnen (die Rekonstruktion durch Scannen des Transkripts bleibt als Fallback für nie angeheftete
Verläufe bestehen). Der schreibgeschützte, ticketgebundene eigenständige Host überschneidet sich mit Boards als
persistente Oberfläche zum erneuten Öffnen — ein Konsolidierungskandidat, der in T6 zu bewerten ist, nicht
als gegeben angenommen.

Komposition: v1 verwendet Raster-Nachbarschaft (Agent-Chrome-Widget neben einem App-Widget in
einem Tab). v2 ergänzt **hostverwaltete App-Slots** — das HTML des Agent-Widgets deklariert eine
Slot-Region, und der Host setzt die echte App-Ansicht als benachbarte Sandbox zusammen.
Die App wird niemals innerhalb des Agent-iframe gerendert: Verschachtelung würde die Bridge-
Identität aufbrechen und Overlay-/Clickjacking-Angriffe auf die gewährte App-UI ermöglichen; der Slot ist daher ein
Layout-Vertrag und keine Einbettung.

### Serverbezogene Widgets (angeheftete MCP-Apps)

Mit dem vereinheitlichten Host ist das Anheften einer Drittanbieter-MCP-App einfach ein Widget, dessen
Inhalt vom Server abgerufen statt gespeichert wird: `board_widgets` behält den
Deskriptor (`serverName`, `toolName`, `uiResourceUri`, ursprüngliche
`toolCallId` + `sessionKey`) statt der HTML-Bytes, und das Board stellt die
Ansichts-Lease über die 10-minütige TTL des Chat-Turns hinaus neu aus (bei Veraltung wird die `ui://`-Ressource
erneut abgerufen). Inline-MCP-App-Ansichten im Chat erhalten dieselbe **An Dashboard anheften**-
Option wie Agent-Widgets. Erneut geöffnete Ansichten sind heute absichtlich schreibgeschützt;
angeheftete Apps, die interaktiv bleiben sollen, erhalten eine dauerhafte Gewährung für die
app-sichtbaren Tools des Servers (explizite Allowlist, die dem Operator beim Anheften angezeigt wird), entkoppelt
vom ausstellenden Lauf. Nicht gewährte Anheftungen bleiben schreibgeschützt — und sind weiterhin für Anzeige-
Dashboards nützlich. v1 heftet an das Board der ursprünglichen Sitzung an; sitzungsübergreifendes Anheften
benötigt einen Lease-Broker und muss warten. Abstimmung mit offenem PR #109807 (`ui/message`-
Composer-Routing, Weitergabe von Theme/Größe).

### WorkBoard-Integration

Das WorkBoard-Integrationsprogramm belässt Karten und Boards im Besitz des Plugins, verknüpft jedoch versandte Karten über die vorhandenen `sessionKey` und `runId` wieder mit ihren Sitzungs-Boards, stellt WorkBoard-Feeds und Versand über vom Plugin deklarierte Bindings und Aktionen bereit und setzt diese Ergebnisse mit den vorhandenen Widget-Arten `html` und `mcp-app` zusammen, statt einen WorkBoard-spezifischen Widget-Typ einzuführen.

## Layout: fließendes Raster

12 Spalten, feste Zeilenhöhe, **automatisch kompaktierend** (Schwerkraft nach oben, beim
Ziehen zur Seite schieben — Gridstack-Semantik, nativ implementiert; die Rastermathematik bleibt rein und
DOM-frei). Widget-Layoutstatus pro Tab: `{ name, w (1-12), h (rows) }` plus
Reihenfolge. Agent-Vokabular:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (Tab mit einem einzelnen Widget)
- `after: <widgetName>` optionaler Reihenfolgeanker; weggelassen = anhängen
- Benutzer ziehen und skalieren frei; dasselbe Reihenfolge-und-Größe-Modell durchläuft den Roundtrip.

## Datenmodell (Agent-DB)

Neue Tabellen in `agents/<agentId>/agent/openclaw-agent.sqlite`
(**erfordert eine Schema-Versionsanhebung der Agent-DB — Freigabe durch den Operator erforderlich,
bevor dies integriert wird**):

```sql
CREATE TABLE board_tabs (
  session_key TEXT NOT NULL,
  tab_id      TEXT NOT NULL,           -- slug
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  chat_dock   TEXT NOT NULL DEFAULT 'right',  -- left|right|bottom|hidden
  created_by  TEXT NOT NULL,           -- 'user' | 'agent'
  PRIMARY KEY (session_key, tab_id)
) STRICT;

CREATE TABLE board_widgets (
  session_key  TEXT NOT NULL,
  name         TEXT NOT NULL,          -- stable widget name
  tab_id       TEXT NOT NULL,
  title        TEXT,
  html         BLOB NOT NULL,          -- wrapped document source
  sha256       TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  size_w       INTEGER NOT NULL,
  size_h       INTEGER NOT NULL,
  position     INTEGER NOT NULL,       -- order within tab (auto-compact input)
  manifest     TEXT NOT NULL DEFAULT '{}',  -- capability manifest JSON
  grant_state  TEXT NOT NULL DEFAULT 'none', -- none|pending|granted|rejected
  granted_sha  TEXT,                   -- byte-frozen grant
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (session_key, name)
) STRICT;
```

Board-Existenz = beliebige Zeilen für den `sessionKey`. Das Löschen einer Sitzung löscht ihre
Board-Zeilen. `/new`/`/reset` verändert sie nicht.

## Protokolloberfläche

RPCs (Kern-Methodentabelle, TypeBox-Schemas in `gateway-protocol`):

- `board.get { sessionKey }` → Tabs + Widget-Metadaten (keine Bytes) — `operator.read`
- `board.update { sessionKey, ops[] }` — Tab-CRUD/-Neuanordnung, Widget verschieben/skalieren/
  entfernen/loslösen, Dock-Status, Tab fokussieren — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (Agent-Tool-Pfad und Anheftpfad)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { ticket, payload }` — ticketgebundene Tier-1-Statusereignisaufnahme;
  die ältere Trusted-Host-Form `{ sessionKey, widget, payload }` bleibt bestehen —
  `operator.write`
- `board.prompt.authorize { ticket }` — gibt zurück, ob das Senden einer sichtbaren Eingabeaufforderung
  weiterhin eine Bestätigung pro Klick benötigt — `operator.read`
- `board.data.read { ticket, bindingId, params? }` — Gateway-seitige, per Allowlist beschränkte
  Auflösung von Lese-Bindings des Kerns oder aktiver Plugins — `operator.read`
- `board.action { ticket, action, ... }` — Automatisierungsversand mit exakter Gewährung
  über den vorhandenen Cron-Sofortausführungspfad oder das validierte Aktionsverb
  eines aktiven Plugins — `operator.write`

Ereignisse (in `EVENT_SCOPE_GUARDS`, Lesebereich):

- `board.changed { sessionKey, revision, widget? }` — persistierter Status geändert;
  die UI ruft erneut ab (und lädt einen iframe neu, wenn `widget` vorhanden ist).
- `board.command { sessionKey, command }` — vorübergehende UI-Steuerung (Agent wechselt
  den sichtbaren Tab, schaltet das Chat-Dock um) — das `ui.command`-Muster.

Widget-Bytes werden über die authentifizierte HTTP-Oberfläche bereitgestellt, nicht über den Socket.

## Agent-Tools

Insgesamt drei Tools (Kern, immer registriert; Rendering wie heute durch die
`inline-widgets`-Client-Capability gegated):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — nach Name erstellen/aktualisieren; `pin` platziert es auf dem Board.
  Ohne `name`/`pin` verhält es sich exakt wie heute (inline, flüchtig).
- `dashboard { action, ... }` — Verben zur Board-Verwaltung: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Vorhandene `cron`-Tools decken die Automatisierungsebene ab; kein neues Tool erforderlich.

Tool-Beschreibungen vermitteln das Größen-/Anker-Vokabular und das Tier-Modell. Der
Agent wird über Tier-1-Benutzerereignisse durch Sitzungshinweise informiert, z. B.
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Was dadurch ersetzt wird

- **`extensions/workspaces` wird gelöscht.** Experimentell, `enabledByDefault:
false`, nie in einer stabilen Version enthalten (erstmals in 2026.7.2-Betas erschienen). Keine
  Migration; eine Doctor-Regel entfernt veraltete `<stateDir>/workspaces/`, sofern vorhanden.
  Übernommene Ideen: reine Rastermathematik, Bridge-Sicherheitsmodell (Port-Bootstrap,
  Binding-Gating, Ratenbegrenzungen), byte-fixierte Genehmigung.
- **Das Widget-Hosting wird von `extensions/canvas` in den Kern verschoben.** Der Canvas-Dokument-
  Store, der Dokument-Wrapper, die HTTP-Bereitstellung und das `show_widget`-Tool werden Teil des Kerns
  (`src/canvas/`); das Plugin behält das Node-Canvas-Steuerungstool (`canvas`) und
  A2UI. Die `pluginSurfaceUrls["canvas"]`-Ankündigung und die
  `/__openclaw__/canvas`-Pfade sind ausgelieferte Native-Client-Verträge und bleiben
  stabil. Discord-Sitzungen behalten die Discord-eigene `show_widget`-Variante.

## Nichtziele (dieses Programm)

- Mehrbenutzerfreigabe von Boards/ACLs (zukünftig; wird über Sitzungsfreigabe eingeführt).
- Natives Board-Rendering unter macOS/iOS (sie erhalten es überall dort, wo sie die
  Control UI einbetten; der Inline-Widget-Pfad bleibt unverändert).
- Integrierte Daten-Widgets (Sitzungs-/Nutzungs-/Cron-Karten) — die Capability-Bridge und
  vom Agent erstellte Widgets decken v1 ab; eine Registry integrierter Arten kann später folgen.

## Implementierungsplan

Unabhängige Worktrees, mit Codex erstellt, sequenziell prüfen und integrieren. Erst integrieren, dann korrigieren.

| #   | Branch                               | Umfang                                                                                                                                                                              | Abhängig von                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Workspaces-Plugin + UI + Dokumentation + i18n-Schlüssel löschen; Doctor-Bereinigungsregel                                                                                                              | —                                |
| T2  | `claude/dashboard-canvas-core`       | Widget-Hosting + `show_widget` in den Kern verschieben; Canvas-Plugin behält Node-Tool; keine Verhaltensänderung                                                                                | —                                |
| T3  | `claude/dashboard-domain`            | Agent-DB-Tabellen (Schema-Anhebung), `board.*`-RPCs + Ereignisse, `dashboard`-Tool, `show_widget`-Argumente für Anheftung/Name/Manifest, Tier-1-Hinweise, Zurücksetzen behält Board                                  | T2                               |
| T4  | `claude/dashboard-ui`                | Board-Ansicht + Tab-Leiste + fließendes, automatisch kompaktierendes Raster + Chat-Dock (links/rechts/unten/ausgeblendet) + Anheftoption im Transkript + Board-Ansicht in der Seitenleiste + Bestätigung beim Zurücksetzen                           | T3 (zuerst Mock über Entwicklungs-Fixtures) |
| T5  | `claude/dashboard-capabilities`      | Gewährungsspeicher/-UI + Byte-Fixierung; `html`-Widgets auf den gemeinsamen Sandbox-Host verschieben; Host-Tools (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); `net`-CSP; Authoring-Shim | T3, T4                           |
| T7  | `claude/dashboard-mcp-apps`          | `mcp-app`-Inhaltsart: Anheftoption für Inline-App-Ansichten, Deskriptorspeicherung, Lease-Neuausstellung/-Aktualisierung, dauerhafte Server-Tool-Gewährungen (verwendet den ausgelieferten MCP-Apps-Host wieder)                   | T3, T4                           |
| T6  | Feinschliff                               | Live-E2E auf einem temporären Gateway (echte Schlüssel), Screenshots, Korrekturen, benutzerorientierte Neufassung von `/web/dashboard`, Prüfung der standardmäßigen Aktivierung                                                     | alle                              |

Validierung gemäß Repo-Regeln: fokussiertes Vitest lokal, vollständige Gates auf
Crabbox/Testbox, `$autoreview` vor jeder Integration, Live-Nachweis für T6.
