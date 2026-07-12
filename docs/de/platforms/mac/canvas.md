---
read_when:
    - Implementierung des macOS-Canvas-Panels
    - Agentensteuerungen für den visuellen Arbeitsbereich hinzufügen
    - Fehlerbehebung beim Laden von Canvas in WKWebView
summary: Vom Agenten gesteuertes Canvas-Panel, eingebettet über WKWebView und ein benutzerdefiniertes URL-Schema
title: Canvas
x-i18n:
    generated_at: "2026-07-12T15:30:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Die macOS-App bettet mithilfe von `WKWebView` ein vom Agenten gesteuertes **Canvas-Panel** ein, einen
leichtgewichtigen visuellen Arbeitsbereich für HTML/CSS/JS, A2UI und kleine interaktive
UI-Oberflächen.

## Speicherort von Canvas

Der Canvas-Status wird unter Application Support gespeichert:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Das Canvas-Panel stellt diese Dateien über ein benutzerdefiniertes URL-Schema bereit,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Wenn im Stammverzeichnis keine `index.html` vorhanden ist, zeigt die App eine integrierte Grundgerüstseite an.

## Verhalten des Panels

- Rahmenloses, größenveränderbares Panel, das nahe der Menüleiste (oder dem Mauszeiger) verankert ist.
- Merkt sich Größe und Position pro Sitzung.
- Wird automatisch neu geladen, wenn sich lokale Canvas-Dateien ändern.
- Es ist jeweils nur ein Canvas-Panel sichtbar (die Sitzung wird bei Bedarf gewechselt).

Canvas kann unter Settings -> **Allow Canvas** deaktiviert werden. Wenn es deaktiviert ist,
geben Canvas-Node-Befehle `CANVAS_DISABLED` zurück.

## Agenten-API

Canvas wird über den Gateway-WebSocket bereitgestellt, sodass der Agent das
Panel ein- und ausblenden, zu einem Pfad oder einer URL navigieren, JavaScript auswerten und ein
Snapshot-Bild aufnehmen kann:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` akzeptiert lokale Canvas-Pfade, `http(s)`-URLs und `file://`-
URLs. Durch Übergabe von `"/"` wird das lokale Grundgerüst oder die `index.html` angezeigt.

Vom Gateway gehostete Ziele unter `/__openclaw__/canvas/` und
`/__openclaw__/a2ui/` werden über die aktuell auf den Gültigkeitsbereich der Node-Sitzung beschränkte
Canvas-URL aufgelöst. Die App aktualisiert diese kurzlebige Berechtigung vor der Navigation;
Sie müssen eine Berechtigungs-URL nicht selbst erstellen oder kopieren.

## A2UI in Canvas

A2UI wird vom Canvas-Host des Gateways gehostet und innerhalb des Canvas-
Panels gerendert. Wenn der Gateway einen Canvas-Host bekannt gibt, navigiert die macOS-App
beim ersten Öffnen automatisch zur A2UI-Hostseite.

Die bekannt gegebene URL ist auf eine Berechtigung beschränkt, zum Beispiel
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Behandeln Sie sie als kurzlebige Anmeldedaten, nicht als stabilen Link.

### A2UI-Befehle (v0.8)

Canvas akzeptiert A2UI-v0.8-Nachrichten vom Server an den Client: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) wird
noch nicht unterstützt.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Wenn Sie dies lesen können, funktioniert A2UI-Push."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Schneller Funktionstest:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hallo von A2UI"
```

## Auslösen von Agentenläufen über Canvas

Canvas kann über `openclaw://agent?...`-Deep-Links neue Agentenläufe auslösen:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Unterstützte Abfrageparameter:

| Parameter                  | Bedeutung                                             |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Vorausgefüllte Agentenaufforderung.                    |
| `sessionKey`               | Stabile Sitzungskennung.                               |
| `thinking`                 | Optionales Denkprofil.                                 |
| `deliver`, `to`, `channel` | Zustellungsziel.                                       |
| `timeoutSeconds`           | Optionales Zeitlimit für den Lauf.                     |
| `key`                      | Von der App generiertes Sicherheitstoken für vertrauenswürdige lokale Aufrufer. |

Die App fordert eine Bestätigung an, sofern kein gültiger Schlüssel angegeben wird. Links
ohne Schlüssel zeigen vor der Genehmigung die Nachricht und die URL an und ignorieren Felder
zur Zustellungsweiterleitung; Links mit Schlüssel verwenden den normalen Ausführungspfad des Gateways.

## Sicherheitshinweise

- Das Canvas-Schema blockiert Verzeichnisdurchquerung; Dateien müssen sich unter dem Sitzungsstammverzeichnis befinden.
- Lokale Canvas-Inhalte verwenden ein benutzerdefiniertes Schema (kein Loopback-Server erforderlich).
- Externe `http(s)`-URLs sind nur zulässig, wenn ausdrücklich zu ihnen navigiert wird.
- Gewöhnliche Webseiten dienen ausschließlich der Darstellung. Agentenaktionen werden nur über das
  App-eigene Canvas-Schema oder das exakte, auf eine Berechtigung beschränkte Gateway-A2UI-Dokument
  akzeptiert, das von der App ausgewählt wurde; Unterframes, Weiterleitungen, abgelaufene Berechtigungen und geänderte
  Abfragen können keine Aktionen auslösen.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [WebChat](/de/web/webchat)
