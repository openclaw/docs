---
read_when:
    - Vuoi fare una rapida domanda collaterale sulla sessione corrente
    - Stai implementando o facendo debug del comportamento BTW su più client
summary: Domande collaterali effimere con /btw
title: Domande collaterali BTW
x-i18n:
    generated_at: "2026-04-24T09:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` ti permette di fare una rapida domanda collaterale sulla **sessione corrente** senza
trasformare quella domanda nella normale cronologia della conversazione.

È modellato sul comportamento `/btw` di Claude Code, ma adattato
all'architettura Gateway e multi-canale di OpenClaw.

## Cosa fa

Quando invii:

```text
/btw what changed?
```

OpenClaw:

1. crea uno snapshot del contesto della sessione corrente,
2. esegue una chiamata al modello separata **senza strumenti**,
3. risponde solo alla domanda collaterale,
4. lascia invariata l'esecuzione principale,
5. **non** scrive la domanda o la risposta BTW nella cronologia della sessione,
6. emette la risposta come **risultato collaterale live** invece che come normale messaggio dell'assistente.

Il modello mentale importante è:

- stesso contesto di sessione
- query collaterale separata one-shot
- nessuna chiamata agli strumenti
- nessun inquinamento del contesto futuro
- nessuna persistenza nella trascrizione

## Cosa non fa

`/btw` **non**:

- crea una nuova sessione durevole,
- continua il task principale non completato,
- esegue strumenti o cicli di strumenti dell'agente,
- scrive i dati della domanda/risposta BTW nella cronologia della trascrizione,
- compare in `chat.history`,
- sopravvive a un reload.

È intenzionalmente **effimero**.

## Come funziona il contesto

BTW usa la sessione corrente solo come **contesto di sfondo**.

Se l'esecuzione principale è attualmente attiva, OpenClaw crea uno snapshot dello stato attuale dei messaggi
e include il prompt principale in corso come contesto di sfondo, dicendo però esplicitamente al modello di:

- rispondere solo alla domanda collaterale,
- non riprendere o completare il task principale non finito,
- non emettere chiamate agli strumenti o pseudo-chiamate agli strumenti.

Questo mantiene BTW isolato dall'esecuzione principale pur rendendolo consapevole di ciò
di cui tratta la sessione.

## Modello di consegna

BTW **non** viene consegnato come un normale messaggio dell'assistente nella trascrizione.

A livello di protocollo Gateway:

- la normale chat dell'assistente usa l'evento `chat`
- BTW usa l'evento `chat.side_result`

Questa separazione è intenzionale. Se BTW riutilizzasse il normale percorso di eventi `chat`,
i client lo tratterebbero come normale cronologia della conversazione.

Poiché BTW usa un evento live separato e non viene ricaricato da
`chat.history`, scompare dopo un reload.

## Comportamento della superficie

### TUI

Nella TUI, BTW viene renderizzato inline nella vista della sessione corrente, ma resta
effimero:

- visibilmente distinto da una normale risposta dell'assistente
- chiudibile con `Enter` o `Esc`
- non ricaricato dopo un reload

### Canali esterni

Su canali come Telegram, WhatsApp e Discord, BTW viene consegnato come
risposta one-off chiaramente etichettata perché quelle superfici non hanno un concetto
di overlay effimero locale.

La risposta viene comunque trattata come risultato collaterale, non come normale cronologia di sessione.

### Control UI / web

Il Gateway emette correttamente BTW come `chat.side_result`, e BTW non è incluso
in `chat.history`, quindi il contratto di persistenza è già corretto per il web.

L'attuale Control UI necessita ancora di un consumer dedicato `chat.side_result` per
renderizzare BTW live nel browser. Finché questo supporto lato client non sarà disponibile, BTW sarà una funzionalità a livello Gateway con comportamento completo in TUI e sui canali esterni, ma non ancora una UX completa nel browser.

## Quando usare BTW

Usa `/btw` quando vuoi:

- un rapido chiarimento sul lavoro corrente,
- una risposta fattuale collaterale mentre un'esecuzione lunga è ancora in corso,
- una risposta temporanea che non dovrebbe entrare nel contesto futuro della sessione.

Esempi:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando non usare BTW

Non usare `/btw` quando vuoi che la risposta diventi parte del contesto di lavoro
futuro della sessione.

In quel caso, fai la domanda normalmente nella sessione principale invece di usare BTW.

## Correlati

- [Comandi slash](/it/tools/slash-commands)
- [Thinking Levels](/it/tools/thinking)
- [Sessione](/it/concepts/session)
