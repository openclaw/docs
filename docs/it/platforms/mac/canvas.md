---
read_when:
    - Implementazione del pannello Canvas per macOS
    - Aggiunta dei controlli agente per l'area di lavoro visiva
    - Debug dei caricamenti del canvas in WKWebView
summary: Pannello Canvas controllato dall'agente incorporato tramite WKWebView + schema URL personalizzato
title: Tela
x-i18n:
    generated_at: "2026-05-06T08:59:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

L’app macOS incorpora un **pannello Canvas** controllato dall’agente usando `WKWebView`. È un workspace visivo leggero per HTML/CSS/JS, A2UI e piccole superfici UI interattive.

## Dove risiede Canvas

Lo stato di Canvas è archiviato in Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Il pannello Canvas serve questi file tramite uno **schema URL personalizzato**:

- `openclaw-canvas://<session>/<path>`

Esempi:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se non esiste alcun `index.html` nella radice, l’app mostra una **pagina scaffold integrata**.

## Comportamento del pannello

- Pannello senza bordi e ridimensionabile, ancorato vicino alla barra dei menu (o al cursore del mouse).
- Ricorda dimensione/posizione per sessione.
- Si ricarica automaticamente quando i file Canvas locali cambiano.
- È visibile un solo pannello Canvas alla volta (la sessione viene cambiata quando necessario).

Canvas può essere disabilitato da Impostazioni → **Consenti Canvas**. Quando è disabilitato, i comandi Node di canvas restituiscono `CANVAS_DISABLED`.

## Superficie API dell’agente

Canvas è esposto tramite il **Gateway WebSocket**, quindi l’agente può:

- mostrare/nascondere il pannello
- navigare verso un percorso o un URL
- valutare JavaScript
- acquisire un’immagine snapshot

Esempi CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Note:

- `canvas.navigate` accetta **percorsi canvas locali**, URL `http(s)` e URL `file://`.
- Se passi `"/"`, Canvas mostra lo scaffold locale o `index.html`.

## A2UI in Canvas

A2UI è ospitato dal canvas host del Gateway e renderizzato all’interno del pannello Canvas.
Quando il Gateway annuncia un host Canvas, l’app macOS naviga automaticamente alla
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

Smoke rapido:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Attivare esecuzioni dell’agente da Canvas

Canvas può attivare nuove esecuzioni dell’agente tramite deep link:

- `openclaw://agent?...`

Esempio (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

L’app chiede conferma a meno che non venga fornita una chiave valida.

## Note di sicurezza

- Lo schema Canvas blocca il directory traversal; i file devono trovarsi sotto la radice della sessione.
- Il contenuto Canvas locale usa uno schema personalizzato (non è richiesto alcun server loopback locale).
- Gli URL `http(s)` esterni sono consentiti solo quando vengono navigati esplicitamente.

## Correlati

- [app macOS](/it/platforms/macos)
- [WebChat](/it/web/webchat)
