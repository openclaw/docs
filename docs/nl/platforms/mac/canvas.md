---
read_when:
    - Het macOS Canvas-paneel implementeren
    - Agentbesturing toevoegen voor de visuele werkruimte
    - Fouten opsporen bij het laden van canvas in WKWebView
summary: Door de agent aangestuurd Canvas-paneel, ingebed via WKWebView en een aangepast URL-schema
title: Canvas
x-i18n:
    generated_at: "2026-07-16T16:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

De macOS-app bevat een door een agent bestuurd **Canvas-paneel** dat gebruikmaakt van `WKWebView`, een
lichtgewicht visuele werkruimte voor HTML/CSS/JS, A2UI en kleine interactieve
UI-oppervlakken.

## Waar Canvas zich bevindt

De Canvas-status wordt opgeslagen onder Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Het Canvas-paneel biedt deze bestanden aan via een aangepast URL-schema,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Als er geen `index.html` in de hoofdmap bestaat, toont de app een ingebouwde basispagina.

## Gedrag van het paneel

- Randloos paneel waarvan de grootte kan worden aangepast, verankerd bij de menubalk (of muiscursor).
- Onthoudt de grootte/positie per sessie.
- Wordt automatisch opnieuw geladen wanneer lokale Canvas-bestanden veranderen.
- Er is slechts één Canvas-paneel tegelijk zichtbaar (er wordt indien nodig van sessie gewisseld).

Canvas kan worden uitgeschakeld via Settings -> **Allow Canvas**. Wanneer het is uitgeschakeld,
geven Canvas-Node-opdrachten `CANVAS_DISABLED` terug.

## API-oppervlak voor agents

Canvas wordt beschikbaar gesteld via de Gateway-WebSocket, zodat de agent het
paneel kan tonen/verbergen, naar een pad of URL kan navigeren, JavaScript kan
uitvoeren en een momentopname kan vastleggen:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` accepteert lokale Canvas-paden, `http(s)`-URL's en `file://`-
URL's. Als je `"/"` doorgeeft, wordt de lokale basispagina of `index.html` getoond.

Door de Gateway gehoste doelen onder `/__openclaw__/canvas/` en
`/__openclaw__/a2ui/` worden omgezet via de huidige bereikgebonden
Canvas-URL van de Node-sessie. De app vernieuwt die kortstondige mogelijkheid vóór de navigatie;
je hoeft zelf geen mogelijkheid-URL te maken of te kopiëren.

## A2UI in Canvas

A2UI wordt gehost door de Canvas-host van de Gateway en weergegeven in het Canvas-
paneel. Wanneer de Gateway een Canvas-host aankondigt, navigeert de macOS-app
bij de eerste opening automatisch naar de A2UI-hostpagina.

De aangekondigde URL is bereikgebonden, bijvoorbeeld
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Behandel deze als tijdelijke aanmeldgegevens, niet als een stabiele link.

### A2UI-opdrachten (v0.8)

Canvas accepteert A2UI v0.8-berichten van server naar client: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) wordt
nog niet ondersteund.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Als je dit kunt lezen, werkt A2UI-push."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Snelle rooktest:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hallo vanuit A2UI"
```

## Agentruns activeren vanuit Canvas

Canvas kan nieuwe agentruns activeren via `openclaw://agent?...`-deeplinks:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Ondersteunde queryparameters:

| Parameter                  | Betekenis                                             |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Vooraf ingevulde agentprompt.                         |
| `sessionKey`               | Stabiele sessie-id.                                   |
| `thinking`                 | Optioneel denkprofiel.                                |
| `deliver`, `to`, `channel` | Afleverdoel.                                          |
| `timeoutSeconds`           | Optionele time-out voor de run.                       |
| `key`                      | Door de app gegenereerd veiligheidstoken voor vertrouwde lokale aanroepers. |

De app vraagt om bevestiging, tenzij een geldige sleutel wordt verstrekt. Links
zonder sleutel tonen vóór goedkeuring het bericht en de URL en negeren velden
voor afleveringsroutering; links met een sleutel gebruiken het normale Gateway-pad voor runs.

## Beveiligingsopmerkingen

- Het Canvas-schema blokkeert directory traversal; bestanden moeten zich onder de sessiehoofdmap bevinden.
- Lokale Canvas-inhoud gebruikt een aangepast schema (geen loopbackserver vereist).
- Externe `http(s)`-URL's zijn alleen toegestaan wanneer er expliciet naartoe wordt genavigeerd.
- Gewone webpagina's kunnen alleen worden weergegeven. Agentacties worden alleen geaccepteerd vanuit het
  Canvas-schema dat eigendom is van de app of het exacte bereikgebonden Gateway A2UI-document
  dat door de app is geselecteerd; subframes, omleidingen, verlopen mogelijkheden en gewijzigde
  query's kunnen geen acties verzenden.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [WebChat](/nl/web/webchat)
