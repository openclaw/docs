---
read_when:
    - Implementazione del pannello Canvas di macOS
    - Aggiunta di controlli agente per l'area di lavoro visiva
    - Debug dei caricamenti canvas in WKWebView
summary: Pannello Canvas controllato dall'agente incorporato tramite WKWebView + schema URL personalizzato
title: Area di disegno
x-i18n:
    generated_at: "2026-06-28T00:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

L'app macOS incorpora un **pannello Canvas** controllato dall'agente usando `WKWebView`. È
uno spazio di lavoro visivo leggero per HTML/CSS/JS, A2UI e piccole superfici
UI interattive.

## Dove vive Canvas

Lo stato di Canvas è archiviato in Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Il pannello Canvas serve quei file tramite uno **schema URL personalizzato**:

- `openclaw-canvas://<session>/<path>`

Esempi:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Se non esiste alcun `index.html` nella root, l'app mostra una **pagina scaffold integrata**.

## Comportamento del pannello

- Pannello senza bordi e ridimensionabile, ancorato vicino alla barra dei menu (o al cursore del mouse).
- Ricorda dimensione/posizione per sessione.
- Si ricarica automaticamente quando i file Canvas locali cambiano.
- È visibile un solo pannello Canvas alla volta (la sessione viene cambiata secondo necessità).

Canvas può essere disabilitato da Impostazioni → **Consenti Canvas**. Quando è disabilitato, i
comandi dei nodi canvas restituiscono `CANVAS_DISABLED`.

## Superficie API dell'agente

Canvas è esposto tramite il **Gateway WebSocket**, quindi l'agente può:

- mostrare/nascondere il pannello
- navigare verso un percorso o URL
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

- `canvas.navigate` accetta **percorsi canvas locali**, URL `http(s)` e URL `file://`.
- Se passi `"/"`, Canvas mostra lo scaffold locale o `index.html`.

## A2UI in Canvas

A2UI è ospitato dall'host canvas del Gateway e renderizzato dentro il pannello Canvas.
Quando il Gateway annuncia un host Canvas, l'app macOS naviga automaticamente alla
pagina host A2UI alla prima apertura.

URL predefinito dell'host A2UI:

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

## Attivazione di esecuzioni dell'agente da Canvas

Canvas può attivare nuove esecuzioni dell'agente tramite deep link:

- `openclaw://agent?...`

Esempio (in JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parametri di query supportati:

- `message`: prompt dell'agente precompilato.
- `sessionKey`: identificatore stabile della sessione.
- `thinking`: profilo di ragionamento opzionale.
- `deliver`, `to` o `channel`: destinazione di consegna.
- `timeoutSeconds`: timeout di esecuzione opzionale.
- `key`: token di sicurezza generato dall'app per chiamanti locali attendibili.

L'app chiede conferma a meno che non venga fornita una chiave valida. I link senza chiave
mostrano il messaggio e l'URL prima dell'approvazione e ignorano i campi di routing della consegna;
i link con chiave usano il normale percorso di esecuzione del Gateway.

## Note sulla sicurezza

- Lo schema Canvas blocca l'attraversamento delle directory; i file devono trovarsi sotto la root della sessione.
- Il contenuto Canvas locale usa uno schema personalizzato (non è richiesto alcun server local loopback).
- Gli URL esterni `http(s)` sono consentiti solo quando vengono navigati esplicitamente.

## Correlati

- [app macOS](/it/platforms/macos)
- [WebChat](/it/web/webchat)
