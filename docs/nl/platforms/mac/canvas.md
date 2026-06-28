---
read_when:
    - Het macOS Canvas-paneel implementeren
    - Agentbedieningselementen toevoegen voor visuele werkruimte
    - WKWebView-canvasloads debuggen
summary: Door agent beheerd Canvas-paneel ingebed via WKWebView + aangepast URL-schema
title: Canvas
x-i18n:
    generated_at: "2026-06-28T00:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

De macOS-app sluit een door de agent aangestuurd **Canvas-paneel** in met `WKWebView`. Het
is een lichte visuele werkruimte voor HTML/CSS/JS, A2UI en kleine interactieve
UI-oppervlakken.

## Waar Canvas staat

Canvas-status wordt opgeslagen onder Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Het Canvas-paneel serveert die bestanden via een **aangepast URL-schema**:

- `openclaw-canvas://<session>/<path>`

Voorbeelden:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Als er geen `index.html` in de root bestaat, toont de app een **ingebouwde scaffold-pagina**.

## Paneelgedrag

- Randloos, aanpasbaar paneel dat is verankerd bij de menubalk (of muiscursor).
- Onthoudt grootte/positie per sessie.
- Herlaadt automatisch wanneer lokale Canvas-bestanden veranderen.
- Er is slechts één Canvas-paneel tegelijk zichtbaar (de sessie wordt indien nodig gewisseld).

Canvas kan worden uitgeschakeld via Settings → **Allow Canvas**. Wanneer uitgeschakeld, geven canvas
node-opdrachten `CANVAS_DISABLED` terug.

## Agent-API-oppervlak

Canvas wordt beschikbaar gesteld via de **Gateway WebSocket**, zodat de agent het volgende kan doen:

- het paneel tonen/verbergen
- naar een pad of URL navigeren
- JavaScript evalueren
- een snapshot-afbeelding vastleggen

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

A2UI wordt gehost door de Gateway-canvas-host en binnen het Canvas-paneel gerenderd.
Wanneer de Gateway een Canvas-host adverteert, navigeert de macOS-app bij de eerste opening automatisch naar de
A2UI-hostpagina.

Standaard-URL van de A2UI-host:

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

## Agent-runs starten vanuit Canvas

Canvas kan nieuwe agent-runs starten via deep links:

- `openclaw://agent?...`

Voorbeeld (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Ondersteunde queryparameters:

- `message`: vooraf ingevulde agent-prompt.
- `sessionKey`: stabiele sessie-identificatie.
- `thinking`: optioneel denkprofiel.
- `deliver`, `to` of `channel`: afleverdoel.
- `timeoutSeconds`: optionele run-time-out.
- `key`: door de app gegenereerd veiligheidstoken voor vertrouwde lokale callers.

De app vraagt om bevestiging tenzij er een geldige key is opgegeven. Links zonder key
tonen het bericht en de URL vóór goedkeuring en negeren routeringsvelden voor aflevering;
links met key gebruiken het normale Gateway-runpad.

## Beveiligingsopmerkingen

- Het Canvas-schema blokkeert directory traversal; bestanden moeten onder de sessieroot staan.
- Lokale Canvas-inhoud gebruikt een aangepast schema (geen local loopback-server vereist).
- Externe `http(s)`-URL's zijn alleen toegestaan wanneer er expliciet naartoe wordt genavigeerd.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [WebChat](/nl/web/webchat)
