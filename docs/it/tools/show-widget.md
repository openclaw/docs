---
read_when:
    - Vuoi che un agente visualizzi un risultato interattivo all'interno della chat web
    - Ti serve il contratto relativo all'input, alla sicurezza o alla conservazione di show_widget
sidebarTitle: Show widget
summary: Visualizza widget SVG o HTML autonomi direttamente nella chat web
title: Mostra widget
x-i18n:
    generated_at: "2026-07-12T07:34:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` esegue il rendering inline di un frammento SVG o HTML autonomo nella trascrizione della chat dell'interfaccia di controllo. Il plugin Canvas incluso gestisce lo strumento e ospita ogni risultato come documento Canvas con la stessa origine.

Lo strumento è disponibile solo quando il client Gateway di origine dichiara la funzionalità `inline-widgets`. L'interfaccia di controllo dichiara automaticamente questa funzionalità. Le esecuzioni nei canali come Telegram e WhatsApp non ricevono `show_widget`.

Il trasporto delle funzionalità copre i backend dei modelli incorporati, basati sul server applicativo Codex e supportati dalla CLI. I chiamanti MCP autenticati tramite concessione e i chiamanti diretti dello strumento tramite HTTP mantengono un comportamento fail-closed perché non dichiarano le funzionalità del client.

## Usare lo strumento

L'agente fornisce due stringhe obbligatorie:

<ParamField path="title" type="string" required>
  Titolo breve visualizzato con l'anteprima inline e nel titolo del documento ospitato.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Frammento SVG o HTML autonomo. L'input che, dopo la rimozione degli spazi iniziali e finali, inizia con `<svg` viene sottoposto a rendering in modalità SVG; tutti gli altri input vengono trattati come frammenti HTML. Lunghezza massima: 262.144 caratteri.
</ParamField>

Il risultato dello strumento include un riferimento all'anteprima Canvas, quindi la chat web esegue il rendering del widget direttamente dalla chiamata allo strumento e lo ripristina dopo il ricaricamento della cronologia. Le trascrizioni che non eseguono il rendering delle anteprime mostrano comunque il percorso Canvas ospitato.

## Sicurezza e archiviazione

I documenti dei widget utilizzano una Content Security Policy restrittiva: sono consentiti stili e script inline, le immagini possono utilizzare URL `data:`, mentre le richieste esterne e il caricamento di risorse sono bloccati. Mantieni tutto il markup, gli stili, gli script e i dati delle immagini all'interno di `widget_code`.

L'iframe omette sempre `allow-same-origin`, anche quando la modalità di incorporamento globale dell'interfaccia di controllo è `trusted`, quindi gli script dei widget non possono leggere l'origine dell'applicazione principale. L'host Canvas distribuisce inoltre i documenti dei widget con un'intestazione di risposta `Content-Security-Policy: sandbox allow-scripts`, quindi l'apertura diretta dell'URL ospitato continua a eseguire il widget in un'origine opaca anziché nell'origine dell'interfaccia di controllo. Il sandboxing del browser non impedisce a uno script di reindirizzare il proprio iframe; esegui il rendering solo del codice dei widget che sei disposto a eseguire in quel frame isolato.

L'iframe segue anche [`gateway.controlUi.embedSandbox`](/it/web/control-ui#hosted-embeds). Il livello predefinito `scripts` supporta i widget interattivi mantenendo al contempo l'isolamento dell'origine.

Canvas conserva al massimo 32 widget per sessione (o per agente quando non è disponibile alcuna sessione). La creazione di un altro widget rimuove il documento meno recente in tale ambito.

## Contenuti correlati

- [Incorporamenti ospitati dell'interfaccia di controllo](/it/web/control-ui#hosted-embeds)
- [Plugin Canvas](/it/plugins/reference/canvas)
- [Funzionalità client del protocollo Gateway](/it/gateway/protocol#client-capabilities)
