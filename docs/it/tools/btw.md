---
read_when:
    - Vuoi fare una rapida domanda laterale sulla sessione corrente
    - Stai implementando o debuggando il comportamento BTW nei vari client
summary: Domande laterali effimere con /btw
title: Domande laterali BTW
x-i18n:
    generated_at: "2026-04-05T14:05:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# Domande laterali BTW

`/btw` ti permette di fare una rapida domanda laterale sulla **sessione corrente** senza
trasformare quella domanda nella normale cronologia della conversazione.

Si ispira al comportamento `/btw` di Claude Code, ma è adattato all'architettura
Gateway e multi-canale di OpenClaw.

## Cosa fa

Quando invii:

```text
/btw what changed?
```

OpenClaw:

1. acquisisce un'istantanea del contesto della sessione corrente,
2. esegue una chiamata al modello separata **senza strumenti**,
3. risponde solo alla domanda laterale,
4. lascia invariata l'esecuzione principale,
5. **non** scrive la domanda o la risposta BTW nella cronologia della sessione,
6. emette la risposta come **risultato laterale live** invece che come normale messaggio dell'assistente.

Il modello mentale importante è:

- stesso contesto di sessione
- query laterale separata monouso
- nessuna chiamata a strumenti
- nessun inquinamento del contesto futuro
- nessuna persistenza nella trascrizione

## Cosa non fa

`/btw` **non**:

- crea una nuova sessione durevole,
- continua l'attività principale incompiuta,
- esegue strumenti o loop di strumenti dell'agente,
- scrive i dati di domanda/risposta BTW nella cronologia della trascrizione,
- compare in `chat.history`,
- sopravvive a un ricaricamento.

È intenzionalmente **effimero**.

## Come funziona il contesto

BTW usa la sessione corrente solo come **contesto di sfondo**.

Se l'esecuzione principale è attualmente attiva, OpenClaw acquisisce un'istantanea dello
stato corrente dei messaggi e include il prompt principale in corso come contesto di sfondo, dicendo
esplicitamente al modello di:

- rispondere solo alla domanda laterale,
- non riprendere o completare l'attività principale incompiuta,
- non emettere chiamate a strumenti o pseudo-chiamate a strumenti.

In questo modo BTW rimane isolato dall'esecuzione principale pur restando consapevole di ciò
di cui tratta la sessione.

## Modello di recapito

BTW **non** viene recapitato come un normale messaggio dell'assistente nella trascrizione.

A livello di protocollo Gateway:

- la normale chat dell'assistente usa l'evento `chat`
- BTW usa l'evento `chat.side_result`

Questa separazione è intenzionale. Se BTW riutilizzasse il normale percorso dell'evento `chat`,
i client lo tratterebbero come normale cronologia della conversazione.

Poiché BTW usa un evento live separato e non viene riprodotto da
`chat.history`, scompare dopo il ricaricamento.

## Comportamento nelle interfacce

### TUI

Nella TUI, BTW viene renderizzato inline nella vista della sessione corrente, ma resta
effimero:

- visibilmente distinto da una normale risposta dell'assistente
- chiudibile con `Enter` o `Esc`
- non riprodotto dopo il ricaricamento

### Canali esterni

Su canali come Telegram, WhatsApp e Discord, BTW viene recapitato come
risposta una tantum chiaramente etichettata, perché queste interfacce non hanno un concetto di overlay effimero locale.

La risposta viene comunque trattata come risultato laterale, non come normale cronologia della sessione.

### Control UI / web

Il Gateway emette correttamente BTW come `chat.side_result`, e BTW non è incluso
in `chat.history`, quindi il contratto di persistenza è già corretto per il web.

L'attuale Control UI necessita ancora di un consumer dedicato `chat.side_result` per
renderizzare BTW live nel browser. Finché questo supporto lato client non sarà disponibile, BTW resterà una
funzionalità a livello Gateway con pieno comportamento in TUI e sui canali esterni, ma non ancora
un'esperienza browser completa.

## Quando usare BTW

Usa `/btw` quando vuoi:

- un chiarimento rapido sul lavoro corrente,
- una risposta laterale fattuale mentre è ancora in corso un'esecuzione lunga,
- una risposta temporanea che non dovrebbe diventare parte del contesto futuro della sessione.

Esempi:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando non usare BTW

Non usare `/btw` quando vuoi che la risposta diventi parte del futuro
contesto di lavoro della sessione.

In quel caso, chiedi normalmente nella sessione principale invece di usare BTW.

## Correlati

- [Comandi slash](/tools/slash-commands)
- [Livelli di Thinking](/tools/thinking)
- [Sessione](/it/concepts/session)
