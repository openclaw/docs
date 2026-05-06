---
read_when:
    - Het macOS Canvas-paneel implementeren
    - Agentbedieningselementen toevoegen voor visuele werkruimte
    - Fouten opsporen bij het laden van WKWebView-canvas
summary: Door agent aangestuurd Canvas-paneel ingebed via WKWebView + aangepast URL-schema
title: Canvas
x-i18n:
    generated_at: "2026-05-06T09:23:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

De macOS-app integreert een agentgestuurd **Canvas-paneel** met `WKWebView`. Het
is een lichte visuele werkruimte voor HTML/CSS/JS, A2UI en kleine interactieve
UI-oppervlakken.

## Waar Canvas zich bevindt

Canvas-status wordt opgeslagen onder Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Het Canvas-paneel serveert die bestanden via een **aangepast URL-schema**:

- `openclaw-canvas://<session>/<path>`

Voorbeelden:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Als er geen `index.html` in de root bestaat, toont de app een **ingebouwde scaffoldpagina**.

## Paneelgedrag

- Randloos, aanpasbaar paneel dat is verankerd bij de menubalk (of muiscursor).
- Onthoudt grootte/positie per sessie.
- Herlaadt automatisch wanneer lokale Canvas-bestanden wijzigen.
- Er is maar één Canvas-paneel tegelijk zichtbaar (sessie wordt indien nodig gewisseld).

Canvas kan worden uitgeschakeld via Settings → **Canvas toestaan**. Wanneer uitgeschakeld, retourneren canvas
node-opdrachten `CANVAS_DISABLED`.

## Agent-API-oppervlak

Canvas wordt beschikbaar gesteld via de **Gateway WebSocket**, zodat de agent het volgende kan doen:

- het paneel tonen/verbergen
- naar een pad of URL navigeren
- JavaScript evalueren
- een snapshotafbeelding vastleggen

CLI-voorbeelden:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Opmerkingen:

- `canvas.navigate` accepteert **lokale Canvas-paden**, `http(s)`-URL's en `file://`-URL's.
- Als je `"/"` doorgeeft, toont Canvas de lokale scaffold of `index.html`.

## A2UI in Canvas

A2UI wordt gehost door de Gateway-canvas-host en weergegeven binnen het Canvas-paneel.
Wanneer de Gateway een Canvas-host adverteert, navigeert de macOS-app bij het
eerste openen automatisch naar de A2UI-hostpagina.

Standaard-URL van A2UI-host:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI-opdrachten (v0.8)

Canvas accepteert momenteel **A2UI v0.8** server→client-berichten:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) wordt niet ondersteund.

CLI-voorbeeld:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Snelle smoke-test:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Agent-runs vanuit Canvas starten

Canvas kan nieuwe agent-runs starten via deep links:

- `openclaw://agent?...`

Voorbeeld (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

De app vraagt om bevestiging, tenzij er een geldige sleutel is opgegeven.

## Beveiligingsopmerkingen

- Het Canvas-schema blokkeert directory traversal; bestanden moeten onder de sessieroot staan.
- Lokale Canvas-inhoud gebruikt een aangepast schema (geen loopbackserver vereist).
- Externe `http(s)`-URL's zijn alleen toegestaan wanneer er expliciet naartoe wordt genavigeerd.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [WebChat](/nl/web/webchat)
