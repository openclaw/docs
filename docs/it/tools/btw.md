---
read_when:
    - Vuoi porre una breve domanda secondaria sulla sessione corrente
    - Stai implementando o eseguendo il debug del comportamento BTW nei vari client
summary: Domande secondarie effimere con /btw
title: A proposito, domande collaterali
x-i18n:
    generated_at: "2026-05-06T09:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` ti consente di porre una rapida domanda laterale sulla **sessione corrente** senza
trasformare quella domanda in normale cronologia della conversazione. `/side` è un alias.

È modellato sul comportamento di `/btw` di Claude Code, ma adattato al
Gateway di OpenClaw e alla sua architettura multicanale.

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

- stesso contesto della sessione
- query laterale one-shot separata
- nessuna chiamata a strumenti
- nessuna contaminazione del contesto futuro
- nessuna persistenza della trascrizione

## Cosa non fa

`/btw` **non**:

- crea una nuova sessione durevole,
- continua l'attività principale incompiuta,
- esegue strumenti o loop di strumenti dell'agente,
- scrive i dati di domanda/risposta BTW nella cronologia della trascrizione,
- appare in `chat.history`,
- sopravvive a un ricaricamento.

È intenzionalmente **effimero**.

## Come funziona il contesto

BTW usa la sessione corrente solo come **contesto di sfondo**.

Se l'esecuzione principale è attualmente attiva, OpenClaw acquisisce uno snapshot dello stato
corrente dei messaggi e include il prompt principale in corso come contesto di sfondo,
indicando esplicitamente al modello di:

- rispondere solo alla domanda laterale,
- non riprendere né completare l'attività principale incompiuta,
- non emettere chiamate a strumenti o pseudo-chiamate a strumenti.

Questo mantiene BTW isolato dall'esecuzione principale, pur rendendolo consapevole di ciò di cui
tratta la sessione.

## Modello di consegna

BTW **non** viene consegnato come un normale messaggio di trascrizione dell'assistente.

A livello di protocollo Gateway:

- la chat normale dell'assistente usa l'evento `chat`
- BTW usa l'evento `chat.side_result`

Questa separazione è intenzionale. Se BTW riutilizzasse il normale percorso dell'evento `chat`,
i client lo tratterebbero come normale cronologia della conversazione.

Poiché BTW usa un evento live separato e non viene riprodotto da
`chat.history`, scompare dopo il ricaricamento.

## Comportamento sulle superfici

### TUI

Nella TUI, BTW viene renderizzato inline nella vista della sessione corrente, ma rimane
effimero:

- visibilmente distinto da una normale risposta dell'assistente
- eliminabile con `Enter` o `Esc`
- non riprodotto al ricaricamento

### Canali esterni

Su canali come Telegram, WhatsApp e Discord, BTW viene consegnato come
risposta one-off chiaramente etichettata perché queste superfici non hanno un concetto di
overlay effimero locale.

La risposta viene comunque trattata come risultato laterale, non come normale cronologia della sessione.

### UI di controllo / web

Il Gateway emette correttamente BTW come `chat.side_result`, e BTW non è incluso
in `chat.history`, quindi il contratto di persistenza è già corretto per il web.

L'attuale UI di controllo necessita ancora di un consumer dedicato per `chat.side_result` per
renderizzare BTW live nel browser. Finché tale supporto lato client non sarà disponibile, BTW è una
funzionalità a livello di Gateway con comportamento completo nella TUI e sui canali esterni, ma non ancora
una UX browser completa.

## Quando usare BTW

Usa `/btw` quando vuoi:

- un rapido chiarimento sul lavoro corrente,
- una risposta laterale fattuale mentre una lunga esecuzione è ancora in corso,
- una risposta temporanea che non dovrebbe diventare parte del contesto futuro della sessione.

Esempi:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando non usare BTW

Non usare `/btw` quando vuoi che la risposta diventi parte del
futuro contesto di lavoro della sessione.

In quel caso, poni la domanda normalmente nella sessione principale invece di usare BTW.

## Correlati

<CardGroup cols={2}>
  <Card title="Slash commands" href="/it/tools/slash-commands" icon="terminal">
    Catalogo dei comandi nativi e direttive di chat.
  </Card>
  <Card title="Thinking levels" href="/it/tools/thinking" icon="brain">
    Livelli di impegno di ragionamento per la chiamata al modello della domanda laterale.
  </Card>
  <Card title="Session" href="/it/concepts/session" icon="comments">
    Chiavi di sessione, cronologia e semantica di persistenza.
  </Card>
  <Card title="Steer command" href="/it/tools/steer" icon="arrow-right">
    Inietta un messaggio di guida nell'esecuzione attiva senza terminarla.
  </Card>
</CardGroup>
