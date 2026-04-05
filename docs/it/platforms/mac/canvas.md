---
read_when:
    - Stai implementando il pannello Canvas su macOS
    - Stai aggiungendo controlli dell'agente per il workspace visivo
    - Stai eseguendo il debug dei caricamenti Canvas in WKWebView
summary: Pannello Canvas controllato dall'agente incorporato tramite WKWebView + schema URL personalizzato
title: Canvas
x-i18n:
    generated_at: "2026-04-05T13:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (app macOS)

L'app macOS incorpora un **pannello Canvas** controllato dall'agente usando `WKWebView`. È
un workspace visivo leggero per HTML/CSS/JS, A2UI e piccole superfici UI
interattive.

## Dove si trova Canvas

Lo stato di Canvas viene archiviato sotto Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Il pannello Canvas serve quei file tramite uno **schema URL personalizzato**:

- `openclaw-canvas://<session>/<path>`

Esempi:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se alla radice non esiste alcun `index.html`, l'app mostra una **pagina scaffold integrata**.

## Comportamento del pannello

- Pannello senza bordi, ridimensionabile, ancorato vicino alla barra dei menu (o al cursore del mouse).
- Ricorda dimensione/posizione per sessione.
- Si ricarica automaticamente quando i file Canvas locali cambiano.
- È visibile un solo pannello Canvas alla volta (la sessione viene cambiata secondo necessità).

Canvas può essere disabilitato da Settings → **Allow Canvas**. Quando è disabilitato, i comandi del nodo canvas restituiscono `CANVAS_DISABLED`.

## Superficie API dell'agente

Canvas è esposto tramite il **WebSocket Gateway**, quindi l'agente può:

- mostrare/nascondere il pannello
- navigare verso un percorso o un URL
- valutare JavaScript
- acquisire un'immagine snapshot

Esempi CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Note:

- `canvas.navigate` accetta **percorsi Canvas locali**, URL `http(s)` e URL `file://`.
- Se passi `"/"`, Canvas mostra lo scaffold locale o `index.html`.

## A2UI in Canvas

A2UI è ospitato dall'host Canvas del Gateway e renderizzato all'interno del pannello Canvas.
Quando il Gateway pubblicizza un host Canvas, l'app macOS naviga automaticamente alla
pagina host A2UI alla prima apertura.

URL host A2UI predefinito:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Comandi A2UI (v0.8)

Canvas attualmente accetta messaggi server→client **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) non è supportato.

Esempio CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Smoke test rapido:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Attivare esecuzioni dell'agente da Canvas

Canvas può attivare nuove esecuzioni dell'agente tramite deep link:

- `openclaw://agent?...`

Esempio (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

L'app richiede conferma a meno che non venga fornita una chiave valida.

## Note di sicurezza

- Lo schema Canvas blocca l'attraversamento delle directory; i file devono trovarsi sotto la root della sessione.
- Il contenuto Canvas locale usa uno schema personalizzato (non serve alcun server loopback locale).
- Gli URL esterni `http(s)` sono consentiti solo quando la navigazione avviene esplicitamente.
