---
read_when:
    - Vuoi fare una breve domanda a margine sulla sessione corrente
    - Stai implementando o eseguendo il debug del comportamento BTW nei diversi client
summary: Domande secondarie temporanee con /btw
title: A proposito, domande secondarie
x-i18n:
    generated_at: "2026-05-03T21:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` consente di porre una rapida domanda laterale sulla **sessione corrente** senza
trasformare quella domanda nella normale cronologia della conversazione. `/side` è un alias.

È modellato sul comportamento di `/btw` di Claude Code, ma adattato al Gateway
di OpenClaw e alla sua architettura multicanale.

## Cosa fa

Quando invii:

```text
/btw what changed?
```

OpenClaw:

1. acquisisce uno snapshot del contesto della sessione corrente,
2. esegue una chiamata al modello separata **senza strumenti**,
3. risponde solo alla domanda laterale,
4. lascia invariata l'esecuzione principale,
5. **non** scrive la domanda o la risposta BTW nella cronologia della sessione,
6. emette la risposta come **risultato laterale live** invece che come normale messaggio dell'assistente.

Il modello mentale importante è:

- stesso contesto di sessione
- query laterale separata una tantum
- nessuna chiamata a strumenti
- nessuna contaminazione del contesto futuro
- nessuna persistenza della trascrizione

## Cosa non fa

`/btw` **non**:

- crea una nuova sessione durevole,
- continua l'attività principale incompleta,
- esegue strumenti o loop di strumenti agente,
- scrive i dati di domanda/risposta BTW nella cronologia della trascrizione,
- appare in `chat.history`,
- sopravvive a un ricaricamento.

È intenzionalmente **effimero**.

## Come funziona il contesto

BTW usa la sessione corrente solo come **contesto di sfondo**.

Se l'esecuzione principale è attualmente attiva, OpenClaw acquisisce uno
snapshot dello stato corrente dei messaggi e include il prompt principale in
corso come contesto di sfondo, indicando esplicitamente al modello di:

- rispondere solo alla domanda laterale,
- non riprendere né completare l'attività principale incompleta,
- non emettere chiamate a strumenti o pseudo-chiamate a strumenti.

Questo mantiene BTW isolato dall'esecuzione principale, pur rendendolo
consapevole dell'argomento della sessione.

## Modello di consegna

BTW **non** viene consegnato come un normale messaggio dell'assistente nella trascrizione.

A livello di protocollo Gateway:

- la normale chat dell'assistente usa l'evento `chat`
- BTW usa l'evento `chat.side_result`

Questa separazione è intenzionale. Se BTW riutilizzasse il normale percorso
dell'evento `chat`, i client lo tratterebbero come normale cronologia della conversazione.

Poiché BTW usa un evento live separato e non viene riprodotto da
`chat.history`, scompare dopo un ricaricamento.

## Comportamento sulle superfici

### TUI

Nella TUI, BTW viene visualizzato inline nella vista della sessione corrente,
ma rimane effimero:

- visibilmente distinto da una normale risposta dell'assistente
- eliminabile con `Enter` o `Esc`
- non riprodotto al ricaricamento

### Canali esterni

Su canali come Telegram, WhatsApp e Discord, BTW viene consegnato come una
risposta una tantum chiaramente etichettata, perché queste superfici non hanno
un concetto di overlay effimero locale.

La risposta viene comunque trattata come risultato laterale, non come normale cronologia della sessione.

### Control UI / web

Il Gateway emette correttamente BTW come `chat.side_result`, e BTW non è incluso
in `chat.history`, quindi il contratto di persistenza è già corretto per il web.

L'attuale Control UI necessita ancora di un consumer dedicato per
`chat.side_result` per visualizzare BTW live nel browser. Finché quel supporto
lato client non sarà disponibile, BTW è una funzionalità a livello Gateway con
comportamento completo in TUI e nei canali esterni, ma non ancora una UX browser completa.

## Quando usare BTW

Usa `/btw` quando desideri:

- un chiarimento rapido sul lavoro corrente,
- una risposta laterale fattuale mentre un'esecuzione lunga è ancora in corso,
- una risposta temporanea che non deve diventare parte del contesto futuro della sessione.

Esempi:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando non usare BTW

Non usare `/btw` quando vuoi che la risposta diventi parte del futuro contesto
di lavoro della sessione.

In quel caso, chiedi normalmente nella sessione principale invece di usare BTW.

## Correlati

- [Comandi slash](/it/tools/slash-commands)
- [Livelli di ragionamento](/it/tools/thinking)
- [Sessione](/it/concepts/session)
