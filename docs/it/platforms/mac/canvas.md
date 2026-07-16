---
read_when:
    - Implementazione del pannello Canvas di macOS
    - Aggiunta di controlli dell'agente per l'area di lavoro visiva
    - Debug del caricamento del canvas in WKWebView
summary: Pannello Canvas controllato dall'agente e incorporato tramite WKWebView + schema URL personalizzato
title: Canvas
x-i18n:
    generated_at: "2026-07-16T14:39:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

L'app macOS incorpora un **pannello Canvas** controllato dall'agente mediante `WKWebView`, uno
spazio di lavoro visivo leggero per HTML/CSS/JS, A2UI e piccole superfici
di interfaccia utente interattive.

## Dove si trova Canvas

Lo stato di Canvas viene archiviato in Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Il pannello Canvas espone questi file mediante uno schema URL personalizzato,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Se nella radice non esiste alcun `index.html`, l'app mostra una pagina di base integrata.

## Comportamento del pannello

- Pannello senza bordi e ridimensionabile, ancorato vicino alla barra dei menu (o al cursore del mouse).
- Memorizza dimensioni e posizione per ogni sessione.
- Si ricarica automaticamente quando cambiano i file Canvas locali.
- È visibile un solo pannello Canvas alla volta (la sessione cambia secondo necessità).

Canvas può essere disabilitato da Settings -> **Allow Canvas**. Quando è disabilitato,
i comandi Canvas del nodo restituiscono `CANVAS_DISABLED`.

## Superficie API dell'agente

Canvas è esposto tramite il WebSocket del Gateway, consentendo all'agente di mostrare o nascondere il
pannello, passare a un percorso o URL, valutare JavaScript e acquisire
un'immagine istantanea:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` accetta percorsi Canvas locali, URL `http(s)` e URL `file://`.
Passando `"/"` viene mostrata la pagina di base locale o `index.html`.

Le destinazioni ospitate dal Gateway in `/__openclaw__/canvas/` e
`/__openclaw__/a2ui/` vengono risolte mediante l'URL Canvas con ambito corrente della sessione
del nodo. L'app aggiorna questa funzionalità di breve durata prima della navigazione;
non è necessario creare o copiare manualmente un URL di funzionalità.

## A2UI in Canvas

A2UI è ospitato dall'host Canvas del Gateway e visualizzato all'interno del pannello
Canvas. Quando il Gateway annuncia un host Canvas, al primo avvio l'app macOS passa
automaticamente alla pagina dell'host A2UI.

L'URL annunciato è limitato all'ambito della funzionalità, ad esempio
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Deve essere trattato come credenziale temporanea, non come collegamento stabile.

### Comandi A2UI (v0.8)

Canvas accetta i messaggi A2UI v0.8 dal server al client: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) non è
ancora supportato.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Se è possibile leggere questo testo, il push A2UI funziona."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Test rapido di verifica:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Saluti da A2UI"
```

## Avvio delle esecuzioni dell'agente da Canvas

Canvas può avviare nuove esecuzioni dell'agente mediante i deep link `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parametri di query supportati:

| Parametro                  | Significato                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Prompt dell'agente precompilato.                               |
| `sessionKey`               | Identificatore stabile della sessione.                            |
| `thinking`                 | Profilo di ragionamento facoltativo.                            |
| `deliver`, `to`, `channel` | Destinazione di recapito.                                      |
| `timeoutSeconds`           | Timeout di esecuzione facoltativo.                                 |
| `key`                      | Token di sicurezza generato dall'app per chiamanti locali attendibili. |

L'app richiede una conferma, a meno che non venga fornita una chiave valida. I collegamenti
senza chiave mostrano il messaggio e l'URL prima dell'approvazione e ignorano i campi
di instradamento del recapito; i collegamenti con chiave utilizzano il normale percorso di esecuzione del Gateway.

## Note sulla sicurezza

- Lo schema Canvas blocca l'attraversamento delle directory; i file devono trovarsi nella radice della sessione.
- I contenuti Canvas locali usano uno schema personalizzato (non è necessario un server di loopback).
- Gli URL `http(s)` esterni sono consentiti solo quando vi si accede esplicitamente.
- Le normali pagine web consentono solo la visualizzazione. Le azioni dell'agente vengono accettate solo dallo
  schema Canvas di proprietà dell'app o dallo specifico documento A2UI del Gateway con ambito
  di funzionalità selezionato dall'app; i sottoframe, i reindirizzamenti, le funzionalità scadute e le query
  modificate non possono inviare azioni.

## Contenuti correlati

- [App macOS](/it/platforms/macos)
- [WebChat](/it/web/webchat)
